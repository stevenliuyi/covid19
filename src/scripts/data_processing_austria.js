const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/eu-data/dataset'
const data_file = 'covid-19-at.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_austria = {}
output_austria = {
    ENGLISH: 'Austria',
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
    const curedCount = parseInt(lineSplit[3], 10)
    const deadCount = parseInt(lineSplit[4], 10)
    const date = lineSplit[5].slice(0, 10)

    if (regionEnglish === 'sum') {
        if (!isNaN(confirmedCount)) output_austria['confirmedCount'][date] = confirmedCount
        if (!isNaN(curedCount)) output_austria['curedCount'][date] = curedCount
        if (!isNaN(deadCount)) output_austria['deadCount'][date] = deadCount
    } else {
        const region = en2zh[regionEnglish]
        assert(region != null, `${regionEnglish} does not exist!`)

        if (!(region in output_austria)) {
            output_austria[region] = { ENGLISH: regionEnglish, confirmedCount: {}, curedCount: {}, deadCount: {} }
        }
        if (!isNaN(confirmedCount)) output_austria[region]['confirmedCount'][date] = confirmedCount
        if (!isNaN(curedCount)) output_austria[region]['curedCount'][date] = curedCount
        if (!isNaN(deadCount)) output_austria[region]['deadCount'][date] = deadCount
    }
})

fs.writeFileSync(`public/data/austria.json`, JSON.stringify(output_austria))

// modify map
const mapName = 'gadm36_AUT_1'
let map = JSON.parse(fs.readFileSync(`public/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    const regionEnglish = geo.properties.NAME_1
    const region = en2zh[regionEnglish]

    assert(region != null, `${regionEnglish} does not exist!`)
    geo.properties.CHINESE_NAME = region
    geo.properties.REGION = `奥地利.${region}`
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
