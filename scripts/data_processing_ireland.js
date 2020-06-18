const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/ireland-data'
const data_file = 'raw.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_ireland = {}
output_ireland = {
    ENGLISH: 'Ireland',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

data.forEach((line, index) => {
    if (index === 0 || line === '') return
    const lineSplit = line.split(',')

    const date = lineSplit[4].replace(/\//g, '-').slice(0, 10)
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    let regionEnglish = lineSplit[2]
    let region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    const confirmedCount = parseInt(lineSplit[10], 10)

    if (!(region in output_ireland)) {
        output_ireland[region] = {
            ENGLISH: regionEnglish,
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }
    }
    output_ireland[region]['confirmedCount'][date] = confirmedCount
})

fs.writeFileSync(`public/data/ireland.json`, JSON.stringify(output_ireland))

// modify map
const mapName = 'gadm36_IRL_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    if (regionEnglish === 'Laoighis') regionEnglish = 'Laois'
    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_ireland) {
        geo.properties.REGION = `爱尔兰.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
