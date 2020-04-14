const fs = require('fs')
const assert = require('assert')
const _ = require('lodash')

const data_folder = 'data/1p3a-data'
const confirmed_data_file = 'confirmed.json'
const deaths_data_file = 'deaths.json'
let confirmed_data = JSON.parse(fs.readFileSync(`${data_folder}/${confirmed_data_file}`))
let deaths_data = JSON.parse(fs.readFileSync(`${data_folder}/${deaths_data_file}`))

const us_file = 'public/data/us.json'
let output_us = JSON.parse(fs.readFileSync(us_file))

const states_abbr_en = JSON.parse(fs.readFileSync('data/map-translations/us_states_abbr_en.json'))
const states_abbr_zh = JSON.parse(fs.readFileSync('data/map-translations/us_states_abbr_zh.json'))

function convertDate(rawDateString) {
    return `2020-${rawDateString.split('/').map((x) => x.padStart(2, '0')).join('-')}`
}

function parseCounty(county) {
    county = county.replace(/\u200B/g, '').replace(/\./g, '').trim()
    county = county.split('--')[0]
    return county
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
    'Dekalb, TN': 'DeKalb',
    'Bear River, UT': 'Box Elder',
    'Mcduffie, GA': 'McDuffie',
    'Joplin, MO': 'Jasper',
    'Mckean, PA': 'McKean',
    'De Witt, TX': 'DeWitt',
    'Mcintosh, GA': 'McIntosh',
    'Hillsborough-Manchester, NH': 'Hillsborough',
    'Hillsborough-Nashua, NH': 'Hillsborough',
    'Hillsborough-other, NH': 'Hillsborough',
    'Obrien, IA': "O'Brien",
    'Petersburg, AK': 'Wrangell-Petersburg',
    'Adam, OH': 'Adams'
}

const metric_data = {
    confirmedCount: confirmed_data,
    deadCount: deaths_data
}

Object.keys(metric_data).map((metric) => {
    const data = metric_data[metric].map((x) => {
        if (`${x.county[0]}, ${x.state_name[0]}` in county_name_changes) {
            x.county = [ county_name_changes[`${x.county[0]}, ${x.state_name[0]}`] ]
        }
        x.county[0] = parseCounty(x.county[0])
        return x
    })

    Object.keys(states_abbr_zh).forEach((stateAbbr) => {
        // obtain data for a state
        const state = states_abbr_zh[stateAbbr]

        // initialization
        if (!(state in output_us))
            output_us[state] = {
                ENGLISH: states_abbr_en[stateAbbr],
                confirmedCount: {},
                curedCount: {},
                deadCount: {}
            }

        const stateData = data.filter((x) => x.state_name[0] === stateAbbr)

        stateData.forEach((record) => {
            const county = record.county[0]

            // initialization
            if (!(county in output_us[state]))
                output_us[state][county] = {
                    ENGLISH: county,
                    confirmedCount: {},
                    curedCount: {},
                    deadCount: {}
                }

            output_us[state][county][metric] = record.entries
                .filter((x) => !isNaN(new Date(convertDate(x[0]))))
                .reduce((s, x) => {
                    s[convertDate(x[0])] = x[1]
                    return s
                }, {})
        })
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
    if (countyEnglish === 'Desoto' && stateAbbr === 'FL') countyEnglish = 'DeSoto'
    if (countyEnglish === 'De Kalb' && stateAbbr === 'AL') countyEnglish = 'DeKalb'
    if (countyEnglish === 'De Kalb' && stateAbbr === 'IN') countyEnglish = 'DeKalb'
    if (countyEnglish === 'LaPorte' && stateAbbr === 'IN') countyEnglish = 'La Porte'
    if (countyEnglish === 'De Kalb' && stateAbbr === 'MO') countyEnglish = 'DeKalb'
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
