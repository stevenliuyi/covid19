const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/eu-data/dataset'
const data_file = 'covid-19-de.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_germany = {}
output_germany = {
    ENGLISH: 'Germany',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

data.forEach((line, index) => {
    if (index === 0) return
    const lineSplit = line.split(',')
    if (lineSplit[0] === '') return

    let regionEnglish = lineSplit[1]
    const confirmedCount = parseInt(lineSplit[2], 10)
    const deadCount = parseInt(lineSplit[4], 10)
    const date = lineSplit[5].slice(0, 10)

    if (regionEnglish === 'sum') {
        output_germany['confirmedCount'][date] = confirmedCount
        output_germany['deadCount'][date] = deadCount
    } else {
        let region = en2zh[regionEnglish]
        if (regionEnglish === 'Repatriierte') {
            regionEnglish = 'Evacuation'
            region = '撤侨'
        }
        assert(region != null, `${regionEnglish} does not exist!`)

        if (!(region in output_germany)) {
            output_germany[region] = { ENGLISH: regionEnglish, confirmedCount: {}, curedCount: {}, deadCount: {} }
        }
        output_germany[region]['confirmedCount'][date] = confirmedCount
        output_germany[region]['deadCount'][date] = deadCount
    }
})

fs.writeFileSync(`public/data/germany.json`, JSON.stringify(output_germany))

// modify map
const mapName = 'gadm36_DEU_1'
let map = JSON.parse(fs.readFileSync(`public/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    const regionEnglish = geo.properties.NAME_1
    const region = en2zh[regionEnglish]

    geo.properties.CHINESE_NAME = region
    geo.properties.REGION = `德国.${region}`
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
