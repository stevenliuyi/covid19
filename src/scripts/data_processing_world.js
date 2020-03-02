const fs = require('fs')
const _ = require('lodash')
const assert = require('assert')

const data_folder = 'data/jhu-data/csse_covid_19_data/csse_covid_19_time_series'
const confirmed_file = `${data_folder}/time_series_19-covid-Confirmed.csv`
const cured_file = `${data_folder}/time_series_19-covid-Recovered.csv`
const dead_file = `${data_folder}/time_series_19-covid-Deaths.csv`

// match names between database and map
const mapNames = {
    UK: 'United Kingdom',
    US: 'United States of America'
}

// translations
const en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

// ignore comma inside double quotes when processing data
// reference: https://stackoverflow.com/a/40672956
const splitCSV = function(string) {
    var matches = string.match(/(\s*"[^"]+"\s*|\s*[^,]+|,)(?=,|$)/g)
    if (matches == null) return null
    for (var n = 0; n < matches.length; ++n) {
        matches[n] = matches[n].trim()
        if (matches[n] === ',') matches[n] = ''
    }
    if (string[0] === ',') matches.unshift('')
    return matches
}

function generateData(filename, metric) {
    // initialization
    let output_world = {}
    output_world[en2zh['Global']] = { ENGLISH: 'Global' }
    output_world[en2zh['Global']][metric] = {}

    let data = fs.readFileSync(filename, 'utf8')

    let dates = []
    let lineSplitLength = 0
    data.split(/\r?\n/).forEach(function(line, index) {
        if (index === 0) {
            // read dates from the first line
            dates = line.split(',').slice(4).map((date) => {
                const [ m, d, y ] = date.split('/')
                return `20${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
            })
        } else {
            // ignore comma inside double quotes when processing data
            let lineSplit = splitCSV(line)
            if (lineSplit == null) return

            if (lineSplitLength > 0)
                assert(lineSplit.length === lineSplitLength, `Error occurred when processing ${line}`)

            if (lineSplitLength === 0) lineSplitLength = lineSplit.length

            let province = lineSplit[0].replace(/"/g, '').trim()
            let country = lineSplit[1].replace(/"/g, '').trim()

            // treat Diamond Princess cases separately
            if (country === 'Others') {
                country = 'International Conveyance'
                province = 'Diamond Princess'
            }

            // match names from map
            if (country in mapNames) country = mapNames[country]

            const countryKey = en2zh[country] ? en2zh[country] : country
            const provinceKey = en2zh[province] ? en2zh[province] : province

            if (!(countryKey in output_world)) {
                output_world[countryKey] = {
                    ENGLISH: country
                }
                output_world[countryKey][metric] = {}
            }

            dates.forEach((date, index) => {
                const count = parseInt(lineSplit[index + 4], 10) || 0
                if (province === '') {
                    output_world[countryKey][metric][date] = count
                } else {
                    if (!(provinceKey in output_world[countryKey])) {
                        output_world[countryKey][provinceKey] = {
                            ENGLISH: province
                        }
                        output_world[countryKey][provinceKey][metric] = {}
                    }
                    output_world[countryKey][provinceKey][metric][date] = count
                    if (output_world[countryKey][metric][date] == null) output_world[countryKey][metric][date] = 0
                    output_world[countryKey][metric][date] += count
                }
                if (output_world[en2zh['Global']][metric][date] == null) output_world[en2zh['Global']][metric][date] = 0
                output_world[en2zh['Global']][metric][date] += count
            })
        }
    })

    return output_world
}

const confirmedData = generateData(confirmed_file, 'confirmedCount')
const curedData = generateData(cured_file, 'curedCount')
const deadData = generateData(dead_file, 'deadCount')
let allData = _.merge(_.merge(confirmedData, curedData), deadData)

// combine data from Mainland China, Hong Kong, Macau and Taiwan
const chineseRegions = [ 'Mainland China', 'Hong Kong', 'Macau', 'Taiwan' ]
allData[en2zh['China']] = {}

chineseRegions.forEach((region) => {
    allData[en2zh['China']][en2zh[region]] = Object.assign({}, allData[en2zh[region]])
})

allData[en2zh['China']] = {
    ...allData[en2zh['China']],
    ENGLISH: 'China',
    confirmedCount: _.mergeWith({}, ...chineseRegions.map((region) => allData[en2zh[region]].confirmedCount), _.add),
    curedCount: _.mergeWith({}, ...chineseRegions.map((region) => allData[en2zh[region]].curedCount), _.add),
    deadCount: _.mergeWith({}, ...chineseRegions.map((region) => allData[en2zh[region]].deadCount), _.add)
}
chineseRegions.forEach((region) => delete allData[en2zh[region]])

fs.writeFileSync(`public/data/world.json`, JSON.stringify(allData))

// modify world map

let map = JSON.parse(fs.readFileSync('public/maps/world-50m.json'))
let objectName = 'ne_50m_admin_0_countries'
let geometries = map.objects[objectName].geometries

// ISO3166 country codes
const iso3166Codes = JSON.parse(fs.readFileSync('data/map-translations/iso3166_codes.json'))

geometries.forEach((geo) => {
    let countryName = geo.properties.NAME
    if (countryName === 'Macedonia') countryName = 'North Macedonia'
    if (countryName === 'Czechia') countryName = 'Czech Republic'
    if (countryName === 'Dominican Rep.') countryName = 'Dominican Republic'
    geo.properties.NAME = countryName

    let countryKey = en2zh[countryName] ? en2zh[countryName] : countryName

    // political correctness
    if ([ '香港', '澳门', '台湾' ].includes(countryKey)) {
        countryKey = '中国'
        geo.properties.NAME = 'China'
    }

    geo.properties.CHINESE_NAME = countryKey

    if (countryKey in allData) {
        const output = allData[countryKey]
        geo.properties = {
            ...geo.properties,
            confirmedCount: output.confirmedCount,
            curedCount: output.curedCount,
            deadCount: output.deadCount
        }
    } else {
        // add Chinese names for all unaffected countries
        if (geo.properties.ISO_A3) geo.properties.CHINESE_NAME = iso3166Codes[geo.properties.ISO_A3]
    }
})

map.objects[objectName].geometries = geometries
fs.writeFileSync(`public/maps/world-50m.json`, JSON.stringify(map))
