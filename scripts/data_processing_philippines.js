const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/philippines-data/data'
const data_file = 'cases_ph.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_philippines = {
    ENGLISH: 'Philippines',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

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

const cities = {
    'Metro Manila': [
        'Caloocan City',
        'Las Piñas City',
        'Makati City',
        'Malabon City',
        'Mandaluyong City',
        'City of Manila',
        'Marikina City',
        'Muntinlupa City',
        'Navotas City',
        'Parañaque City',
        'Pasay City',
        'Pasig City',
        'Pateros',
        'Quezon City',
        'San Juan City',
        'Taguig City',
        'Valenzuela City'
    ],
    Maguindanao: [ 'Cotabato City' ],
    Rizal: [ 'Antipolo City' ],
    Quezon: [ 'Lucena City' ]
}

const name_changes = {
    NCR: 'Metro Manila',
    'Manila City': 'City of Manila',
    Manila: 'City of Manila',
    'City of Parañaque': 'Parañaque City',
    'Las Pinas City': 'Las Piñas City',
    'City of Las Piñas': 'Las Piñas City',
    'City of Makati': 'Makati City',
    'City of Muntinlupa': 'Muntinlupa City',
    'City of San Juan': 'San Juan City',
    'City of Pasig': 'Pasig City',
    'City of Marikina': 'Marikina City',
    'City of Mandaluyong': 'Mandaluyong City',
    'City of Malabon': 'Malabon City',
    'City of Valenzuela': 'Valenzuela City',
    Caloocan: 'Caloocan City',
    'City of Antipolo': 'Antipolo City',
    'Rodriguez (Montalban)': 'Rodriguez',
    'Zamboanga Del Sur': 'Zamboanga del Sur',
    'Lanao Del Sur': 'Lanao del Sur',
    'Lanao Del Norte': 'Lanao del Norte',
    'Davao Del Sur': 'Davao del Sur',
    'Compostela Valley': 'Davao de Oro'
}

const raw_data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

// fix data
let data = []
let lineEnded = true
raw_data.forEach((line, index) => {
    if (index === 0) return
    if (lineEnded) {
        data.push(line)
    } else {
        data[data.length - 1] += line
    }
    let time = line.split(',')
    time = time[time.length - 1]
    lineEnded = !isNaN(new Date(time))
})

data.forEach((line, index) => {
    if (line === '') return
    const lineSplit = splitCSV(line)
    let date = lineSplit[10]
    if (date.toLowerCase().includes('validation') || date === '') return
    date = date.slice(0, 10)
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    let provinceEnglish = lineSplit[14].replace(/"/g, '').replace(/�/g, 'ñ')
    let cityEnglish = null
    if (provinceEnglish === '' || provinceEnglish === 'None' || provinceEnglish.includes('validation')) return

    if (provinceEnglish.includes(',')) {
        cityEnglish = provinceEnglish.split(',')[0].trim()
        provinceEnglish = provinceEnglish.split(',')[1].trim()
    }
    if (provinceEnglish in name_changes) provinceEnglish = name_changes[provinceEnglish]
    if (cityEnglish in name_changes) cityEnglish = name_changes[cityEnglish]

    const provinceIdx = Object.keys(cities).findIndex((x) => cities[x].includes(provinceEnglish))
    if (provinceIdx >= 0) {
        cityEnglish = provinceEnglish
        provinceEnglish = Object.keys(cities)[provinceIdx]
    }

    const province = en2zh[provinceEnglish]
    const city = cityEnglish

    assert(province != null, `${lineSplit[14]} does not exist!`)

    if (!(province in output_philippines)) {
        output_philippines[province] = {
            ENGLISH: provinceEnglish,
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }
    }

    if (city != null && !(city in output_philippines[province])) {
        output_philippines[province][city] = {
            ENGLISH: cityEnglish,
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }
    }

    if (!(date in output_philippines[province]['confirmedCount']))
        output_philippines[province]['confirmedCount'][date] = 0
    output_philippines[province]['confirmedCount'][date] += 1

    if (city != null) {
        if (!(date in output_philippines[province][city]['confirmedCount']))
            output_philippines[province][city]['confirmedCount'][date] = 0
        output_philippines[province][city]['confirmedCount'][date] += 1
    }
})

function parseDate(date) {
    const [ year, month, day ] = date.substr(0, 10).split('-')
    return new Date(year, month - 1, day)
}

// calculate cumulative counts
function calcCumulativeCount(obj) {
    Object.keys(obj)
        .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH' ].includes(x))
        .forEach((region) => {
            const dates = Object.keys(obj[region]['confirmedCount']).sort(
                (a, b) => (parseDate(a) > parseDate(b) ? 1 : -1)
            )
            const firstDate = dates[0]
            const lastDate = dates[dates.length - 1]

            let currentDate = firstDate
            let prevDate = null
            while (parseDate(currentDate) <= parseDate(lastDate)) {
                if (currentDate !== firstDate) {
                    if (!(currentDate in obj[region]['confirmedCount'])) {
                        obj[region]['confirmedCount'][currentDate] = obj[region]['confirmedCount'][prevDate]
                    } else {
                        obj[region]['confirmedCount'][currentDate] += obj[region]['confirmedCount'][prevDate]
                    }
                }

                // next day
                prevDate = currentDate
                currentDate = parseDate(currentDate)
                currentDate.setDate(currentDate.getDate() + 1)
                currentDate = currentDate.toISOString().slice(0, 10)
            }
        })

    return obj
}

output_philippines = calcCumulativeCount(output_philippines)
Object.keys(output_philippines)
    .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH' ].includes(x))
    .forEach((region) => {
        output_philippines[region] = calcCumulativeCount(output_philippines[region])
    })

fs.writeFileSync(`public/data/philippines.json`, JSON.stringify(output_philippines))

// modify map
const mapName = 'gadm36_PHL_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    if (regionEnglish === 'Metropolitan Manila') regionEnglish = 'Metro Manila'
    if (regionEnglish === 'Compostela Valley') regionEnglish = 'Davao de Oro'
    if (regionEnglish === 'North Cotabato') regionEnglish = 'Cotabato'

    const region = en2zh[regionEnglish]
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_philippines) {
        geo.properties.REGION = `菲律宾.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
