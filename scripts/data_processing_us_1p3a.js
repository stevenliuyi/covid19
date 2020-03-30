const fs = require('fs')
const assert = require('assert')
const _ = require('lodash')

const data_folder = 'data/1p3a-data'
const confirmed_data_file = 'confirmed.json'
const deaths_data_file = 'deaths.json'
const confirmed_data = JSON.parse(fs.readFileSync(`${data_folder}/${confirmed_data_file}`))
const deaths_data = JSON.parse(fs.readFileSync(`${data_folder}/${deaths_data_file}`))
let data = [ ...confirmed_data, ...deaths_data ]

const us_file = 'public/data/us.json'
let output_us = JSON.parse(fs.readFileSync(us_file))

const states_abbr_en = JSON.parse(fs.readFileSync('data/map-translations/us_states_abbr_en.json'))
const states_abbr_zh = JSON.parse(fs.readFileSync('data/map-translations/us_states_abbr_zh.json'))

function convertDate(rawDateString) {
    return `2020-${rawDateString.split('/').map((x) => x.padStart(2, '0')).join('-')}`
}

function parseDate(date) {
    const [ year, month, day ] = date.substr(0, 10).split('-')
    return new Date(year, month - 1, day)
}

const county_name_changes = {
    'Walla Walla County, WA': 'Walla Walla',
    'Walton County, FL': 'Walton',
    'Delaware County, IN': 'Delaware',
    'Verm., IN': 'Vermillion',
    'Elko County, NV': 'Elko',
    'Filmore, MN': 'Fillmore',
    'LeSeur, MN': 'Le Sueur',
    'Blue earth, MN': 'Blue Earth',
    'Lac Qui Parle, MN': 'Lac qui Parle',
    'Seward, AK': 'Kenai Peninsula',
    'Soldotna, AK': 'Kenai Peninsula',
    'Sterling, AK': 'Kenai Peninsula',
    'Homer, AK': 'Kenai Peninsula',
    'Matanuska-Susitna Borough, AK': 'Matanuska-Susitna',
    'Palmer, AK': 'Matanuska-Susitna',
    'Eagle River, AK': 'Anchorage',
    'Gridwood, AK': 'Anchorage',
    'North Pole, AK': 'Fairbanks North Star',
    'Dekalb, TN': 'DeKalb',
    'Bear River, UT': 'Box Elder',
    'Mcduffie, GA': 'McDuffie',
    'Wayne--Detroit, MI': 'Wayne',
    'Joplin, MO': 'Jasper',
    'Mckean, PA': 'McKean',
    'De Witt, TX': 'DeWitt',
    'Unitah, UT': 'Uintah, UT'
}

data = data.map((x) => {
    if (`${x.county}, ${x.state_name}` in county_name_changes) {
        x.county = county_name_changes[`${x.county}, ${x.state_name}`]
    }
    x.county = x.county.replace(/\u200B/g, '')
    return x
})

let latestDate = [
    ...new Set(data.map((x) => convertDate(x.confirmed_date)).sort((a, b) => (parseDate(a) < parseDate(b) ? 1 : -1)))
][0]

latestDate = parseDate(latestDate)

Object.keys(states_abbr_zh).forEach((stateAbbr) => {
    // obtain data for a state
    const state = states_abbr_zh[stateAbbr]

    // initialization
    output_us[state] = {
        ENGLISH: states_abbr_en[stateAbbr],
        confirmedCount: {},
        curedCount: {},
        deadCount: {}
    }

    const stateData = data
        .filter((caseData) => caseData.state_name === stateAbbr)
        .filter((caseData) => caseData.county != null && caseData.confirmed_date != null)
    const counties = [ ...new Set(stateData.map((x) => x.county).map((x) => x.replace(/\./g, '').trim())) ]

    if (!(state in output_us)) {
        output_us[state] = {
            ENGLISH: states_abbr_en[stateAbbr],
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }
    }

    counties.forEach((county) => {
        // initialization
        output_us[state][county] = {
            ENGLISH: county,
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }

        // county data
        const countyData = stateData.filter((caseData) => caseData.county.replace(/\./g, '').trim() === county)

        // date of first case for the county
        let firstDate = [
            ...new Set(
                stateData
                    .filter((x) => x.county.replace(/\./g, '').trim() === county)
                    .map((x) => convertDate(x.confirmed_date))
                    .sort((a, b) => (parseDate(a) > parseDate(b) ? 1 : -1))
            )
        ][0]
        firstDate = parseDate(firstDate)

        let currentDate = firstDate
        let previousDate = null
        while (currentDate <= latestDate) {
            let currentDateStr = currentDate.toISOString()
            currentDateStr = `${parseInt(currentDateStr.slice(5, 7), 10)}/${parseInt(currentDateStr.slice(8, 10), 10)}`
            const currentDateCases = countyData.filter((x) => x.confirmed_date === currentDateStr)
            const confirmedCount = currentDateCases
                .map((x) => (x.people_count ? x.people_count : 0))
                .reduce((s, x) => s + x, 0)
            const deadCount = currentDateCases.map((x) => (x.die_count ? x.die_count : 0)).reduce((s, x) => s + x, 0)

            const dateString = currentDate.toISOString().slice(0, 10)
            if (previousDate != null) {
                const previousDateString = previousDate.toISOString().slice(0, 10)
                output_us[state][county]['confirmedCount'][dateString] =
                    output_us[state][county]['confirmedCount'][previousDateString] + confirmedCount
                output_us[state][county]['deadCount'][dateString] =
                    output_us[state][county]['deadCount'][previousDateString] + deadCount
            } else {
                // first day
                output_us[state][county]['confirmedCount'][dateString] = confirmedCount
                output_us[state][county]['deadCount'][dateString] = deadCount
            }
            // next day
            previousDate = new Date(currentDate.getTime())
            currentDate.setDate(currentDate.getDate() + 1)
        }
    })
})

// total numbers of States
Object.keys(states_abbr_zh).forEach((stateAbbr) => {
    const state = states_abbr_zh[stateAbbr]
    Object.keys(output_us[state]).forEach((county) => {
        output_us[state]['confirmedCount'] = _.mergeWith(
            {},
            output_us[state]['confirmedCount'],
            output_us[state][county]['confirmedCount'],
            _.add
        )
        output_us[state]['deadCount'] = _.mergeWith(
            {},
            output_us[state]['deadCount'],
            output_us[state][county]['deadCount'],
            _.add
        )
    })
})

fs.writeFileSync(`public/data/us.json`, JSON.stringify(output_us))

// modify map
const mapName = 'gadm36_USA_2'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    const stateEnglish = geo.properties.NAME_1
    const stateAbbr = Object.keys(states_abbr_en).find((x) => states_abbr_en[x] === stateEnglish)
    const state = states_abbr_zh[stateAbbr]

    let countyEnglish = geo.properties.NAME_2
    const countyAlt = countyEnglish.replace('Saint', 'St')

    if (countyEnglish === 'Dupage' && stateAbbr === 'IL') countyEnglish = 'DuPage'
    if (countyEnglish === 'La Salle' && stateAbbr === 'IL') countyEnglish = 'LaSalle'
    if (countyEnglish === 'De Kalb' && stateAbbr === 'IL') countyEnglish = 'DeKalb'
    if (countyEnglish === 'Portsmouth' && stateAbbr === 'VA') countyEnglish = 'Portsmouth City'
    if (countyEnglish === 'Richmond' && stateAbbr === 'VA' && geo.properties.TYPE_2 === 'Independent City')
        countyEnglish = 'Richmond City'
    if (countyEnglish === 'Hawaii' && stateAbbr === 'HI') countyEnglish = 'Hawaii Island'
    if (countyEnglish === 'Dewitt' && stateAbbr === 'TX') countyEnglish = 'DeWitt'
    if (countyEnglish === 'Desoto' && stateAbbr === 'MS') countyEnglish = 'DeSoto'
    if (countyEnglish === 'De Kalb' && stateAbbr === 'AL') countyEnglish = 'DeKalb'
    if (countyEnglish === 'De Kalb' && stateAbbr === 'IN') countyEnglish = 'DeKalb'
    if (countyEnglish === 'Mc Kean' && stateAbbr === 'PA') countyEnglish = 'McKean'

    // New York boroughs
    if (countyEnglish === 'Bronx' && stateAbbr === 'NY') countyEnglish = 'New York'
    if (countyEnglish === 'Queens' && stateAbbr === 'NY') countyEnglish = 'New York'
    if (countyEnglish === 'Kings' && stateAbbr === 'NY') countyEnglish = 'New York'
    if (countyEnglish === 'Richmond' && stateAbbr === 'NY') countyEnglish = 'New York'

    const county = countyEnglish

    geo.properties.NAME_2 = countyEnglish
    geo.properties.CHINESE_NAME = county
    geo.properties.STATE_CHINESE_NAME = state

    if (output_us[state][county]) {
        geo.properties.REGION = `美国.${state}.${county}`
        output_us[state][county].map = true
    } else if (output_us[state][countyAlt]) {
        geo.properties.NAME_2 = countyAlt
        geo.properties.CHINESE_NAME = countyAlt
        geo.properties.REGION = `美国.${state}.${countyAlt}`
        output_us[state][countyAlt].map = true
    }
})

// check
Object.keys(output_us).map((state) => {
    Object.keys(output_us[state]).filter((x) => ![ 'Unassigned', 'Unknown' ].includes(x)).map((county) => {
        const countyData = output_us[state][county]
        if (countyData.confirmedCount && !countyData.map) {
            console.log(`Cannot find ${county} (${output_us[state].ENGLISH}) in the map!`)
        }
    })
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))

// modify map
map = JSON.parse(fs.readFileSync('data/maps/USA.json'))
let objectName = 'states'
geometries = map.objects[objectName].geometries

geometries.forEach((geo) => {
    let stateEnglish = geo.properties.name
    if (stateEnglish === 'District of Columbia') stateEnglish = 'Washington, D.C.'
    const stateAbbr = Object.keys(states_abbr_en).find((x) => states_abbr_en[x] === stateEnglish)
    const state = states_abbr_zh[stateAbbr]

    geo.properties.CHINESE_NAME = state
    geo.properties.NAME = stateEnglish
    if (output_us[state]) geo.properties.REGION = `美国.${state}`
})

map.objects[objectName].geometries = geometries
fs.writeFileSync(`public/maps/USA.json`, JSON.stringify(map))
