const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/estonia-data'
const data_file = 'data.json'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_estonia = {
    ENGLISH: 'Estonia',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const name_changes = {
    IdaViru: 'Ida-Viru',
    LääneViru: 'Lääne-Viru'
}

const allData = JSON.parse(fs.readFileSync(`${data_folder}/${data_file}`))
const data = allData['countyByDay']['countyByDay']
const dates = allData['dates2']

Object.keys(data).forEach((record) => {
    let regionEnglish = record.replace('maa', '')
    if (regionEnglish in name_changes) regionEnglish = name_changes[regionEnglish]
    if (regionEnglish === 'Info puudulik') return
    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    // initialization
    output_estonia[region] = {
        ENGLISH: regionEnglish,
        confirmedCount: {},
        curedCount: {},
        deadCount: {}
    }

    data[record].forEach((count, idx) => {
        const date = dates[idx]
        assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

        output_estonia[region]['confirmedCount'][date] = count
    })
})

fs.writeFileSync(`public/data/estonia.json`, JSON.stringify(output_estonia))

// modify map
const mapName = 'gadm36_EST_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    const regionEnglish = geo.properties.NAME_1
    const region = en2zh[regionEnglish]

    geo.properties.CHINESE_NAME = region
    assert(region != null, `${regionEnglish} does not exist!`)

    if (region in output_estonia) {
        geo.properties.REGION = `爱沙尼亚.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
