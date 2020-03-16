const fs = require('fs')
const assert = require('assert')
const en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

// modify map
const mapName = 'gadm36_CAN_1'
let map = JSON.parse(fs.readFileSync(`public/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    if (regionEnglish === 'Québec') regionEnglish = 'Quebec'
    const region = en2zh[regionEnglish]

    assert(region != null, `${regionEnglish} does not exist!`)
    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region
    geo.properties.REGION = `加拿大.${region}`
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
