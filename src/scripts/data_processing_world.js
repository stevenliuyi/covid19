const fs = require('fs')
const _ = require('lodash')
const assert = require('assert')

const data_folder = 'data/jhu-data/csse_covid_19_data/csse_covid_19_time_series'
const confirmed_file = `${data_folder}/time_series_covid19_confirmed_global.csv`
const cured_file = `${data_folder}/time_series_covid19_recovered_global.csv`
const dead_file = `${data_folder}/time_series_covid19_deaths_global.csv`
const curr_data_file = 'data/jhu_current_data.csv'

// match names between database and map
const mapNames = {
    US: 'United States of America',
    'Korea, South': 'South Korea',
    'Gambia, The': 'Gambia',
    'Bahamas, The': 'Bahamas',
    'West Bank and Gaza': 'Palestine',
    Burma: 'Myanmar'
}

// translations
const en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))
// const states_abbr_en = JSON.parse(fs.readFileSync('data/map-translations/us_states_abbr_en.json'))
// const states_abbr_zh = JSON.parse(fs.readFileSync('data/map-translations/us_states_abbr_zh.json'))

// current data
let currData = {}
fs.readFileSync(curr_data_file, 'utf8').split(/\r?\n/).forEach((line) => {
    const lineSplit = line.split(',')
    currData[`${lineSplit[1]}|${lineSplit[0]}`] = {
        confirmedCount: parseInt(lineSplit[2], 10),
        curedCount: parseInt(lineSplit[3], 10),
        deadCount: parseInt(lineSplit[4], 10)
    }
})
// total numbers of US
currData['US|'] = { confirmedCount: 0, curedCount: 0, deadCount: 0 }
;[ 'confirmedCount', 'curedCount', 'deadCount' ].forEach((metric) => {
    Object.keys(currData).forEach((x) => {
        if (x.split('|')[0] === 'US' && x.split('|')[1] !== '') {
            currData['US|'][metric] += currData[x][metric]
        }
    })
})

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

// fix errors in the JHU database
// see https://github.com/CSSEGISandData/COVID-19/issues/833
const confirmed_fixes_dict = {
    'Italy||2020-03-12': 15113,
    'Spain||2020-03-12': 3146,
    'France|Metropolitan France|2020-03-12': 2876,
    'United Kingdom|United Kingdom|2020-03-12': 590,
    'Germany||2020-03-12': 2745,
    'Argentina||2020-03-12': 19,
    'Australia||2020-03-12': 122, // should fix states
    'Belgium||2020-03-12': 314,
    'Chile||2020-03-12': 23,
    'Colombia||2020-03-12': 9,
    'Greece||2020-03-12': 98,
    'Indonesia||2020-03-12': 34,
    'Ireland||2020-03-12': 43,
    'Japan||2020-03-12': 620,
    'Netherlands||2020-03-12': 503,
    'Qatar||2020-03-12': 262,
    'Singapore||2020-03-12': 178,
    'United Kingdom|United Kingdom|2020-03-15': 1391,
    'France|Metropolitan France|2020-03-15': 5423
}

const deaths_fixes_dict = {
    'Italy||2020-03-12': 1016,
    'Spain||2020-03-12': 86,
    'France|Metropolitan France|2020-03-12': 61,
    'Germany||2020-03-12': 6,
    'Argentina||2020-03-12': 1,
    'Australia||2020-03-12': 3, // should fix states
    'Greece||2020-03-12': 1,
    'Indonesia||2020-03-12': 1,
    'Ireland||2020-03-12': 1,
    'Japan||2020-03-12': 15,
    'Netherlands||2020-03-12': 5,
    'Switzerland||2020-03-12': 4,
    'United Kingdom|United Kingdom|2020-03-15': 35,
    'France|Metropolitan France|2020-03-15': 127
}

const recovered_fixes_dict = {
    'Italy||2020-03-12': 1258,
    'Spain||2020-03-12': 189,
    'France|Metropolitan France|2020-03-12': 12,
    'Germany||2020-03-12': 25
}

function generateData(filename, metric) {
    // initialization
    let output_world = {}
    output_world[en2zh['Global']] = { ENGLISH: 'Global' }
    output_world[en2zh['Global']][metric] = {}

    let data = fs.readFileSync(filename, 'utf8')

    let dates = []
    let lineSplitLength = 0

    // current day
    let currDate = new Date()
    currDate.setHours(currDate.getHours() - 7)
    currDate = currDate.toISOString().slice(0, 10)

    data.split(/\r?\n/).forEach(function(line, index) {
        if (index === 0) {
            // read dates from the first line
            dates = line.split(',').slice(4).map((date) => {
                const [ m, d, y ] = date.split('/')
                return `20${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
            })
            if (!dates.includes(currDate)) dates.push(currDate)
        } else {
            // ignore comma inside double quotes when processing data
            let lineSplit = splitCSV(line)
            if (lineSplit == null) return

            if (lineSplitLength > 0)
                assert(lineSplit.length === lineSplitLength, `Error occurred when processing ${line}`)

            if (lineSplitLength === 0) lineSplitLength = lineSplit.length

            let province = lineSplit[0].replace(/"/g, '').trim()
            let country = lineSplit[1].replace(/"/g, '').trim()

            // current day
            let currCount = 0
            if (`${country.replace(/,/g, '')}|${province.replace(/,/g, '')}` in currData)
                currCount =
                    parseInt(currData[`${country.replace(/,/g, '')}|${province.replace(/,/g, '')}`][metric], 10) || 0

            // treat Diamond Princess cases separately
            if (country === 'Diamond Princess') {
                country = 'International Conveyance'
                province = 'Diamond Princess'
            }

            // China
            if (country === 'China') {
                if (province !== 'Hong Kong' && province !== 'Macau') country = 'Mainland China'
            }
            if (country === 'Taiwan*') {
                province = 'Taiwan'
                country = 'China'
            }

            // France
            if (country === 'France') {
                if (province === '') province = 'Metropolitan France'
            }
            if ([ 'French Guiana', 'Martinique', 'Reunion' ].includes(country)) {
                province = country
                country = 'France'
            }

            if (country in mapNames)
                // match names from map
                country = mapNames[country]

            if ([ 'Denmark', 'Netherlands', 'United Kingdom' ].includes(country) && province === '') {
                province = country
            }

            const countryKey = en2zh[country] ? en2zh[country] : country
            let provinceKey = en2zh[province] ? en2zh[province] : province

            // US States
            // if (countryKey === '美国') {
            //     let stateAbbr = Object.keys(states_abbr_en).find((x) => states_abbr_en[x] === province)
            //     if (province.split(',').length === 2) stateAbbr = province.split(',')[1].trim()
            //     if (province === 'Washington, D.C.') stateAbbr = 'DC'
            //     if (stateAbbr) {
            //         provinceKey = states_abbr_zh[stateAbbr]
            //     }
            // }

            // initialization
            if (!(countryKey in output_world)) {
                output_world[countryKey] = {
                    ENGLISH: country
                }
                output_world[countryKey][metric] = {}
            }
            if (provinceKey !== '' && !(provinceKey in output_world[countryKey])) {
                output_world[countryKey][provinceKey] = {
                    ENGLISH: province
                }
                output_world[countryKey][provinceKey][metric] = {}
            }

            dates.forEach((date, index) => {
                let count = parseInt(lineSplit[index + 4], 10) || 0

                // current day
                if (index + 4 >= lineSplit.length) count = currCount

                if (metric === 'confirmedCount' && `${country}|${province}|${date}` in confirmed_fixes_dict)
                    // fixes
                    count = confirmed_fixes_dict[`${country}|${province}|${date}`]
                if (metric === 'curedCount' && `${country}|${province}|${date}` in recovered_fixes_dict)
                    count = recovered_fixes_dict[`${country}|${province}|${date}`]
                if (metric === 'deadCount' && `${country}|${province}|${date}` in deaths_fixes_dict)
                    count = deaths_fixes_dict[`${country}|${province}|${date}`]

                if (province === '') {
                    // country may have duplicate names
                    output_world[countryKey][metric][date] =
                        output_world[countryKey][metric][date] == null
                            ? count
                            : Math.max(output_world[countryKey][metric][date], count)
                } else {
                    if (output_world[countryKey][provinceKey][metric][date] == null)
                        output_world[countryKey][provinceKey][metric][date] = 0
                    output_world[countryKey][provinceKey][metric][date] += count

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
allData[en2zh['China']][en2zh['Mainland China']] = allData[en2zh['Mainland China']]

allData[en2zh['China']] = {
    ...allData[en2zh['China']],
    ENGLISH: 'China',
    confirmedCount: _.mergeWith(
        {},
        ...chineseRegions.map((region) => allData[en2zh['China']][en2zh[region]].confirmedCount),
        _.add
    ),
    curedCount: _.mergeWith(
        {},
        ...chineseRegions.map((region) => allData[en2zh['China']][en2zh[region]].curedCount),
        _.add
    ),
    deadCount: _.mergeWith(
        {},
        ...chineseRegions.map((region) => allData[en2zh['China']][en2zh[region]].deadCount),
        _.add
    )
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
    if (countryName === 'Dominican Rep.') countryName = 'Dominican Republic'
    if (countryName === 'Dem. Rep. Congo') countryName = 'Congo (Kinshasa)'
    if (countryName === "Côte d'Ivoire") countryName = "Cote d'Ivoire"
    if (countryName === 'Somaliland') countryName = 'Somalia'
    if (countryName === 'Congo') countryName = 'Congo (Brazzaville)'
    if (countryName === 'Bosnia and Herz.') countryName = 'Bosnia and Herzegovina'
    if (countryName === 'Central African Rep.') countryName = 'Central African Republic'
    if (countryName === 'Faeroe Is.') countryName = 'Faroe Islands'
    if (countryName === 'Eq. Guinea') countryName = 'Equatorial Guinea'

    geo.properties.NAME = countryName

    let countryKey = en2zh[countryName] ? en2zh[countryName] : countryName

    // political correctness
    if ([ '香港', '澳门', '台湾' ].includes(countryKey)) {
        countryKey = '中国'
        geo.properties.NAME = 'China'
    }

    geo.properties.CHINESE_NAME = countryKey

    if (countryKey in allData) {
        geo.properties.REGION = countryKey
    } else if (countryName === 'Greenland' || countryName === 'Faroe Islands') {
        geo.properties.REGION = `丹麦.${countryKey}`
    } else if (countryName === 'Isle of Man') {
        geo.properties.REGION = `英国.皇家属地.${countryKey}`
    } else if (countryName === 'Puerto Rico') {
        geo.properties.REGION = `美国.${countryKey}`
    } else {
        // add Chinese names for all unaffected countries
        if (geo.properties.ISO_A3) geo.properties.CHINESE_NAME = iso3166Codes[geo.properties.ISO_A3]
    }
})

map.objects[objectName].geometries = geometries
fs.writeFileSync(`public/maps/world-50m.json`, JSON.stringify(map))

// modify Europe map

map = JSON.parse(fs.readFileSync('public/maps/europe.json'))
objectName = 'europe'
geometries = map.objects[objectName].geometries

geometries.forEach((geo) => {
    let countryName = geo.properties.NAME
    if (countryName === 'Czech Republic') countryName = 'Czechia'
    if (countryName === 'The former Yugoslav Republic of Macedonia') countryName = 'North Macedonia'
    if (countryName === 'Holy See (Vatican City)') countryName = 'Holy See'

    geo.properties.NAME = countryName

    let countryKey = en2zh[countryName] ? en2zh[countryName] : countryName

    geo.properties.CHINESE_NAME = countryKey

    if (countryKey in allData) {
        geo.properties.REGION = countryKey
    } else if (countryName === 'Faroe Islands') {
        geo.properties.REGION = `丹麦.${countryKey}`
    }
})

map.objects[objectName].geometries = geometries
fs.writeFileSync(`public/maps/europe.json`, JSON.stringify(map))
