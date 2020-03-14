const fs = require('fs')
const assert = require('assert')
const en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

// modify map
const mapName = 'gadm36_AUS_1'
let map = JSON.parse(fs.readFileSync(`public/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    const regionEnglish = geo.properties.NAME_1
    const region = en2zh[regionEnglish]

    assert(region != null, `${regionEnglish} does not exist!`)
    geo.properties.CHINESE_NAME = region
    geo.properties.REGION = `澳大利亚.${region}`
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
