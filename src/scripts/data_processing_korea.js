const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/korea-data'
const line_list_file = 'line_list.csv'
const geo_distribution_file0 = 'geo_distribution_20200120-20200217.csv'
const geo_distribution_file = 'geo_distribution.csv'
const cumulative_numbers_file = 'cumulative_numbers.csv'
const first_date = '2020-01-20'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))
en2zh['Unknown Region'] = '未确定地区'

const korea_cities = {
    'Gyeonggi-do': [ 'Seongnam', 'Goyang' ],
    'Jeollabuk-do': [ 'Iksan' ],
    'Gyeongsangbuk-do': [ 'Pohang', 'Cheongdo-gun' ]
}

let output_korea = {}

// confirmed cases
output_korea.ENGLISH = 'South Korea'
// data before 2020-02-17
const confirmed_data0 = fs.readFileSync(`${data_folder}/${geo_distribution_file0}`, 'utf8')

// data after 2020-02-18
const confirmed_data = fs.readFileSync(`${data_folder}/${geo_distribution_file}`, 'utf8')

const confirmed_data_combined = [ ...confirmed_data0.split(/\r?\n/), ...confirmed_data.split(/r?\n/) ]

function addDataToRegion(newDate, currentDate, region, metric, count, isFirstDay) {
    if (!(newDate in output_korea[region][metric])) {
        if (isFirstDay) {
            // first day for report
            output_korea[region][metric][newDate] = count === '' ? 0 : parseInt(count, 10)
        } else {
            // copy data from previous day
            output_korea[region][metric][newDate] = output_korea[region][metric][currentDate]
            output_korea[region][metric][newDate] += count === '' ? 0 : parseInt(count, 10)
        }
    } else {
        output_korea[region][metric][newDate] += count === '' ? 0 : parseInt(count, 10)
    }
}

function parseDate(date) {
    const [ year, month, day ] = date.substr(0, 10).split('-')
    return new Date(year, month - 1, day)
}

let regions = []
let currentDate = ''
confirmed_data_combined.forEach(function(line, index) {
    const lineSplit = line.split(',')

    if (index === 0) {
        // region names in the header
        regions = lineSplit.slice(2, -1)
        regions.push('Unknown Region')
        regions.forEach((region) => {
            output_korea[en2zh[region]] = { ENGLISH: region, confirmedCount: {}, curedCount: {}, deadCount: {} }
        })
    } else if (index === 30) {
        // region names again, check if matched with previous obtained names
        const regions1 = lineSplit.slice(2, -1)
        regions1.forEach((region, idx) => {
            assert(region, regions[idx], `Region ${region} not matched with ${regions[idx]}`)
        })
    } else {
        const newDate = lineSplit[0]
        lineSplit.slice(2, -1).forEach((count, idx) => {
            const region = regions[idx]
            addDataToRegion(newDate, currentDate, en2zh[region], 'confirmedCount', count, index === 1)
        })
        addDataToRegion(newDate, currentDate, en2zh['Unknown Region'], 'confirmedCount', 0, true)
        currentDate = newDate
    }
})

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

// recovered and death cases
const data = fs.readFileSync(`${data_folder}/${line_list_file}`, 'utf8').split(/\r?\n/)

// recovered cases
const cured_index = 26

assert(
    data[0].split(',')[cured_index] === 'date_discharged',
    `${data[0].split(',')[cured_index]} not matched with 'date_discharged'`
)

const curedData = data
    .slice(1)
    .filter((x) => splitCSV(x)[cured_index] !== '')
    .sort((a, b) => (splitCSV(a)[cured_index] > splitCSV(b)[cured_index] ? 1 : -1))

const latestDate = currentDate
currentDate = first_date
let nextDate = ''

// initialization
regions.forEach((region) => {
    addDataToRegion(currentDate, currentDate, en2zh[region], 'curedCount', 0, true)
})

while (currentDate <= latestDate) {
    const currentDateData = curedData.filter((x) => splitCSV(x)[cured_index] === currentDate)

    currentDateData.forEach((x) => {
        const lineSplit = splitCSV(x)
        const city = lineSplit[2] !== '' ? lineSplit[2] : lineSplit[1]

        let region = regions.includes(city)
            ? city
            : Object.keys(korea_cities).find((x) => korea_cities[x].includes(city))
        if (region == null) {
            console.log(`Cannot find the city '${city}' for case #${lineSplit[0]}!`)
            region = 'Unknown Region'
        }
        addDataToRegion(currentDate, currentDate, en2zh[region], 'curedCount', 1, false)
    })

    // next day
    nextDate = parseDate(currentDate)
    nextDate.setDate(nextDate.getDate() + 1)
    nextDate = nextDate.toISOString().slice(0, 10)

    if (nextDate <= latestDate)
        regions.forEach((region) => {
            addDataToRegion(nextDate, currentDate, en2zh[region], 'curedCount', 0, false)
        })

    currentDate = nextDate
}

// death cases
const dead_index = 27

assert(
    data[0].split(',')[dead_index] === 'date_death',
    `${data[0].split(',')[dead_index]} not matched with 'date_death'`
)
const deadData = data
    .slice(1)
    .filter((x) => splitCSV(x)[dead_index] !== '')
    .sort((a, b) => (splitCSV(a)[dead_index] > splitCSV(b)[dead_index] ? 1 : -1))

currentDate = first_date
nextDate = ''

// initialization
regions.forEach((region) => {
    addDataToRegion(currentDate, currentDate, en2zh[region], 'deadCount', 0, true)
})

while (currentDate <= latestDate) {
    const currentDateData = deadData.filter((x) => splitCSV(x)[dead_index] === currentDate)

    currentDateData.forEach((x) => {
        const lineSplit = splitCSV(x)
        const city = lineSplit[2] !== '' ? lineSplit[2] : lineSplit[1]

        let region = regions.includes(city)
            ? city
            : Object.keys(korea_cities).find((x) => korea_cities[x].includes(city))
        if (region == null) {
            console.log(`Cannot find the city '${city}' for case #${lineSplit[0]}!`)
            region = 'Unknown Region'
        }
        addDataToRegion(currentDate, currentDate, en2zh[region], 'deadCount', 1, false)
    })

    // manually add missing cases
    if (currentDate === '2020-02-19' && currentDateData.length === 0) {
        addDataToRegion(currentDate, currentDate, en2zh['Unknown Region'], 'deadCount', 1, false)
    }
    if (currentDate === '2020-02-22' && currentDateData.length === 1) {
        addDataToRegion(currentDate, currentDate, en2zh['Unknown Region'], 'deadCount', 1, false)
    }

    // next day
    nextDate = parseDate(currentDate)
    nextDate.setDate(nextDate.getDate() + 1)
    nextDate = nextDate.toISOString().slice(0, 10)

    if (nextDate <= latestDate)
        regions.forEach((region) => {
            addDataToRegion(nextDate, currentDate, en2zh[region], 'deadCount', 0, false)
        })

    currentDate = nextDate
}

// calculate cumulative counts
currentDate = first_date
output_korea['confirmedCount'] = {}
output_korea['curedCount'] = {}
output_korea['deadCount'] = {}

while (currentDate <= latestDate) {
    ;[ 'confirmedCount', 'curedCount', 'deadCount' ].forEach((metric) => {
        output_korea[metric][currentDate] = Object.keys(output_korea)
            .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH' ].includes(x))
            .map((x) => output_korea[x][metric][currentDate])
            .reduce((s, x) => s + x, 0)
    })

    // next day
    nextDate = parseDate(currentDate)
    nextDate.setDate(nextDate.getDate() + 1)
    nextDate = nextDate.toISOString().slice(0, 10)
    currentDate = nextDate
}

// check if the cumulative numbers match
const cumulative_data = fs.readFileSync(`${data_folder}/${cumulative_numbers_file}`, 'utf8').split(/\r?\n/)
cumulative_data.forEach((line, index) => {
    if (index === 0) return
    const lineSplit = splitCSV(line)
    const date = lineSplit[0]
    ;[ 'confirmedCount', 'curedCount', 'deadCount' ].forEach((metric, idx) => {
        const count = parseInt(lineSplit[idx + 2], 10)
        const sumOfRegions = output_korea[metric][date] ? output_korea[metric][date] : 0
        if (count !== sumOfRegions) {
            //console.log(
            //    `${metric} on ${date} (${count}) doesn't match the sum of counts from all regions (${output_korea[
            //        metric
            //    ][date]}).`
            //)
            output_korea[metric][date] = count
        }
    })
})

fs.writeFileSync(`public/data/korea.json`, JSON.stringify(output_korea))

// modify map
const mapName = 'gadm36_KOR_1'
let map = JSON.parse(fs.readFileSync(`public/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let region = geo.properties.NAME_1

    if (region === 'Jeju') region = 'Jeju-do'
    if (region === 'Sejong') region = 'Sejong City'

    if (!regions.includes(region)) console.log(`${region} does not exist!`)

    geo.properties.NAME_1 = region
    geo.properties.CHINESE_NAME = en2zh[region]

    const output = output_korea[en2zh[region]]
    geo.properties = {
        ...geo.properties,
        confirmedCount: output.confirmedCount,
        curedCount: output.curedCount,
        deadCount: output.deadCount
    }
})
map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
