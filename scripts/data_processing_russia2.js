const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/russia-data-jeetiss/docs'
const data_file = 'timeseries.json'

// translations
const russia_subjects = JSON.parse(fs.readFileSync('data/map-translations/russia_federal_subjects.json'))

let output_russia = {}
output_russia = {
    ENGLISH: 'Russia',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const data = JSON.parse(fs.readFileSync(`${data_folder}/${data_file}`))

const name_changes = {
    'Ханты-Мансийский АО': 'Ханты-Мансийский автономный округ',
    'Республика Северная Осетия — Алания': 'Республика Северная Осетия - Алания'
}

Object.keys(data).forEach((key) => {
    let regionRussian = key
    if (regionRussian in name_changes) regionRussian = name_changes[regionRussian]

    const regionCode = Object.keys(russia_subjects).find((x) => russia_subjects[x].ru === regionRussian)
    assert(regionCode != null, `${regionRussian} does not exist!`)
    const regionEnglish = russia_subjects[regionCode].en
    const region = russia_subjects[regionCode].zh
    assert(region != null || regionEnglish != null, `${regionEnglish} does not exist!`)

    output_russia[region] = {
        ENGLISH: regionEnglish,
        confirmedCount: {},
        curedCount: {},
        deadCount: {}
    }

    data[key].forEach((record) => {
        const date = record['date']
        assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

        output_russia[region]['confirmedCount'][date] = parseInt(record['confirmed'], 10)
        output_russia[region]['curedCount'][date] = parseInt(record['recovered'], 10)
        output_russia[region]['deadCount'][date] = parseInt(record['confirmed'], 10)
    })
})

fs.writeFileSync(`public/data/russia.json`, JSON.stringify(output_russia))
//
// modify map
const mapName = 'gadm36_RUS_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionCode = geo.properties.HASC_1
    if (geo.properties.NAME_1 === 'Moscow City') regionCode = 'RU.MC'
    const region = russia_subjects[regionCode].zh
    const regionEnglish = russia_subjects[regionCode].en
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_russia) {
        geo.properties.REGION = `俄罗斯.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
