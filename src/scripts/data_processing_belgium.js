const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/belgium-data'
const data_file = 'covid19-belgium.json'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_belgium = {}
output_belgium = {
    ENGLISH: 'Belgium',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const regions = [ 'Flanders', 'Brussels', 'Wallonia' ]

regions.forEach((regionEnglish) => {
    const region = en2zh[regionEnglish]
    output_belgium[region] = {
        ENGLISH: regionEnglish,
        confirmedCount: {},
        deadCount: {},
        curedCount: {}
    }
})

const data = JSON.parse(fs.readFileSync(`${data_folder}/${data_file}`))

const confirmed_keys = {
    Flanders: 'cumul_vld',
    Brussels: 'cumul_bru',
    Wallonia: 'cumul_wal'
}

const daily_deaths_keys = {
    Flanders: 'daily_deceased_vld',
    Brussels: 'daily_deceased_bru',
    Wallonia: 'daily_deceased_wal'
}

let prevDate = null
data.data.forEach((record) => {
    let date = record.date
    if (date.includes('/')) {
        date = date.split('/').reverse().join('-')
    } else if (date.includes('-')) {
        date = date.split('-').reverse().join('-')
    }
    date = date.replace(/^20-/, '2020-')
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    regions.forEach((regionEnglish) => {
        const region = en2zh[regionEnglish]
        const confirmedCount = parseInt(record[confirmed_keys[regionEnglish]], 10)
        if (!isNaN(confirmedCount)) output_belgium[region]['confirmedCount'][date] = confirmedCount

        let newDeadCount = parseInt(record[daily_deaths_keys[regionEnglish]], 10)
        if (isNaN(newDeadCount)) newDeadCount = 0

        if (prevDate != null) {
            output_belgium[region]['deadCount'][date] = output_belgium[region]['deadCount'][prevDate] + newDeadCount
        } else {
            output_belgium[region]['deadCount'][date] = newDeadCount
        }
    })

    prevDate = date
})

fs.writeFileSync(`public/data/belgium.json`, JSON.stringify(output_belgium))

// modify map
const mapName = 'gadm36_BEL_1'
let map = JSON.parse(fs.readFileSync(`public/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

const name_changes = {
    Bruxelles: 'Brussels',
    Vlaanderen: 'Flanders',
    Wallonie: 'Wallonia'
}
geometries.forEach((geo) => {
    const regionEnglish = name_changes[geo.properties.NAME_1]
    const region = en2zh[regionEnglish]
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_belgium) {
        geo.properties.REGION = `比利时.${region}`
    } else {
        console.log(regionEnglish)
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
