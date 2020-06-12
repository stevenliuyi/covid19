const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/algeria-data'
const data_file = 'raw.json'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_algeria = {
    ENGLISH: 'Algeria',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const data = JSON.parse(fs.readFileSync(`${data_folder}/${data_file}`))
data.forEach((regionData) => {
    const regionEnglish = regionData.name
    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    output_algeria[region] = {
        ENGLISH: regionEnglish,
        confirmedCount: {},
        curedCount: {},
        deadCount: {}
    }

    regionData.data.forEach((record) => {
        const date = record.date.slice(0, 10)
        assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

        output_algeria[region]['confirmedCount'][date] = record.confirmed
        output_algeria[region]['deadCount'][date] = record.deaths
    })
})

fs.writeFileSync(`public/data/algeria.json`, JSON.stringify(output_algeria))

// modify map
// const mapName = 'gadm36_DZA_1'
// let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
// let geometries = map.objects[mapName].geometries
//
// geometries.forEach((geo) => {
//     let regionEnglish = geo.properties.NAME_1
//     const region = en2zh[regionEnglish]
//
//     geo.properties.NAME_1 = regionEnglish
//     geo.properties.CHINESE_NAME = region
//     assert(region != null, `${regionEnglish} does not exist!`)
//
//     if (region in output_algeria) {
//         geo.properties.REGION = `阿尔及利亚.${region}`
//     }
// })
//
// map.objects[mapName].geometries = geometries
// fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
