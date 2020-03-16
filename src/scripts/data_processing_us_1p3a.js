const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/1p3a-data'
const data_file = 'raw.json'
let data = JSON.parse(fs.readFileSync(`${data_folder}/${data_file}`))

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

let latestDate = [
    ...new Set(data.map((x) => convertDate(x.confirmed_date)).sort((a, b) => (parseDate(a) < parseDate(b) ? 1 : -1)))
][0]

latestDate = parseDate(latestDate)

Object.keys(states_abbr_zh).forEach((stateAbbr) => {
    // obtain data for a state
    const state = states_abbr_zh[stateAbbr]
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
            const confirmedCount = currentDateCases.map((x) => x.people_count).reduce((s, x) => s + x, 0)

            const dateString = currentDate.toISOString().slice(0, 10)
            if (previousDate != null) {
                const previousDateString = previousDate.toISOString().slice(0, 10)
                output_us[state][county]['confirmedCount'][dateString] =
                    output_us[state][county]['confirmedCount'][previousDateString] + confirmedCount
            } else {
                // first day
                output_us[state][county]['confirmedCount'][dateString] = confirmedCount
            }
            // next day
            previousDate = new Date(currentDate.getTime())
            currentDate.setDate(currentDate.getDate() + 1)
        }
    })
})

fs.writeFileSync(`public/data/us.json`, JSON.stringify(output_us))

// modify map
const mapName = 'gadm36_USA_2'
let map = JSON.parse(fs.readFileSync(`public/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    const stateEnglish = geo.properties.NAME_1
    const stateAbbr = Object.keys(states_abbr_en).find((x) => states_abbr_en[x] === stateEnglish)
    const state = states_abbr_zh[stateAbbr]

    let countyEnglish = geo.properties.NAME_2
    const countyAlt = countyEnglish.replace('Saint', 'St')

    if (countyEnglish === 'Dupage' && stateAbbr === 'IL') countyEnglish = 'DuPage'
    if (countyEnglish === 'Virginia Beach' && stateAbbr == 'VA') countyEnglish = 'Virginia Beach City'
    if (countyEnglish === 'Alexandria' && stateAbbr == 'VA') countyEnglish = 'Alexandria City'
    if (countyEnglish === 'Charlottesville' && stateAbbr == 'VA') countyEnglish = 'Charlottesville City'

    const county = countyEnglish

    geo.properties.NAME_2 = countyEnglish
    geo.properties.CHINESE_NAME = county
    geo.properties.STATE_CHINESE_NAME = state

    if (output_us[state][county]) {
        geo.properties.REGION = `美国.${state}.${county}`
        output_us[state][county].map = true
    } else if (output_us[state][countyAlt]) {
        geo.properties.REGION = `美国.${state}.${countyAlt}`
        output_us[state][countyAlt].map = true
    }
})

// check
Object.keys(output_us).map((state) => {
    Object.keys(output_us[state]).filter((x) => x !== 'Unassigned').map((county) => {
        const countyData = output_us[state][county]
        if (countyData.confirmedCount && !countyData.map) {
            console.log(`Cannot find ${county} (${output_us[state].ENGLISH}) in the map!`)
        }
    })
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
