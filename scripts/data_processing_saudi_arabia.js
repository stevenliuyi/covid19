const fs = require('fs')
const _ = require('lodash')
const assert = require('assert')

const data_folder = 'data/saudi-arabia-data'
const data_file = 'raw.json'
const data = JSON.parse(fs.readFileSync(`${data_folder}/${data_file}`))

// translations
const en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_saudi_arabia = {
    ENGLISH: 'Saudi Arabia',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const metrics = {
    Cases: 'confirmedCount',
    Recoveries: 'curedCount',
    Mortalities: 'deadCount'
}

const name_changes = {
    'Eastern Region': 'Eastern Province',
    Jazan: 'Jizan',
    'Al Baha': 'Al Bahah'
}

data.forEach((record) => {
    if (record.fields.daily_cumulative !== 'Cumulative') return
    const date = record.fields.date
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    const metric = metrics[record.fields.indicator]
    if (metric == null) return

    let regionEnglish = record.fields.region
    if (regionEnglish in name_changes) regionEnglish = name_changes[regionEnglish]
    if (regionEnglish === 'Total') return
    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)
    const city = record.fields.city

    if (!(region in output_saudi_arabia)) {
        output_saudi_arabia[region] = {
            ENGLISH: regionEnglish,
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }
    }

    if (!(city in output_saudi_arabia[region])) {
        output_saudi_arabia[region][city] = {
            ENGLISH: city,
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }
    }

    const count = record.fields.cases
    output_saudi_arabia[region][city][metric][date] = count
})

function parseDate(date) {
    const [ year, month, day ] = date.substr(0, 10).split('-')
    return new Date(year, month - 1, day)
}

Object.values(metrics).forEach((metric) => {
    Object.keys(output_saudi_arabia)
        .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH' ].includes(x))
        .forEach((region) => {
            Object.keys(output_saudi_arabia[region])
                .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH' ].includes(x))
                .forEach((city) => {
                    const dates = Object.keys(output_saudi_arabia[region][city][metric]).sort(
                        (a, b) => (parseDate(a) > parseDate(b) ? 1 : -1)
                    )
                    if (dates.length === 0) return
                    const firstDate = dates[0]
                    const lastDate = dates[dates.length - 1]
                    let currentDate = firstDate
                    let prevDate = null
                    while (parseDate(currentDate) <= parseDate(lastDate)) {
                        if (!(currentDate in output_saudi_arabia[region][city][metric])) {
                            output_saudi_arabia[region][city][metric][currentDate] =
                                output_saudi_arabia[region][city][metric][prevDate]
                        }
                        // next day
                        prevDate = currentDate
                        currentDate = parseDate(currentDate)
                        currentDate.setDate(currentDate.getDate() + 1)
                        currentDate = currentDate.toISOString().slice(0, 10)
                    }
                })

            output_saudi_arabia[region][metric] = _.mergeWith(
                {},
                ...Object.keys(output_saudi_arabia[region])
                    .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH' ].includes(x))
                    .map((city) => output_saudi_arabia[region][city][metric]),
                _.add
            )
        })
})

// remove cities
Object.keys(output_saudi_arabia).forEach((region) => {
    output_saudi_arabia[region] = {
        ENGLISH: output_saudi_arabia[region].ENGLISH,
        confirmedCount: output_saudi_arabia[region].confirmedCount,
        curedCount: output_saudi_arabia[region].curedCount,
        deadCount: output_saudi_arabia[region].deadCount
    }
})

fs.writeFileSync(`public/data/saudi_arabia.json`, JSON.stringify(output_saudi_arabia))

// modify map
const mapName = 'gadm36_SAU_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    if (regionEnglish !== 'Al Bahah') regionEnglish = regionEnglish.replace('Al ', '')
    if (regionEnglish === 'Madinah') regionEnglish = 'Medina'
    if (regionEnglish === '`Asir') regionEnglish = 'Asir'
    if (regionEnglish === 'Hudud ash Shamaliyah') regionEnglish = 'Northern Borders'
    if (regionEnglish === 'Quassim') regionEnglish = 'Qassim'
    if (regionEnglish === 'Ar Riyad') regionEnglish = 'Riyadh'
    if (regionEnglish === 'Ash Sharqiyah') regionEnglish = 'Eastern Province'

    const region = en2zh[regionEnglish]
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_saudi_arabia) {
        geo.properties.REGION = `沙特阿拉伯.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
