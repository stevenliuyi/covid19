const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/spain-data/COVID 19'
const data_file = 'ccaa_covid19_datos_isciii.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

const name_changes = {
    'Castilla La Mancha': 'Castilla-La Mancha'
}

let output_spain = {}
output_spain = {
    ENGLISH: 'Spain',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

data.forEach((line, index) => {
    const lineSplit = line.split(',')
    if (index === 0 || line === '') return

    const date = lineSplit[0]
    let regionEnglish = lineSplit[2]
    if (regionEnglish in name_changes) regionEnglish = name_changes[regionEnglish]

    const confirmedCount = parseInt(lineSplit[4], 10)
    const deadCount = parseInt(lineSplit[8], 10)
    const curedCount = parseInt(lineSplit[9], 10)

    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    if (!(region in output_spain)) {
        output_spain[region] = {
            ENGLISH: regionEnglish,
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }
    }

    if (!isNaN(confirmedCount)) output_spain[region]['confirmedCount'][date] = confirmedCount
    if (!isNaN(deadCount)) output_spain[region]['deadCount'][date] = deadCount
    if (!isNaN(curedCount)) output_spain[region]['curedCount'][date] = curedCount
})

fs.writeFileSync(`public/data/spain.json`, JSON.stringify(output_spain))

// modify map
const mapName = 'gadm36_ESP_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1

    if (regionEnglish === 'Comunidad de Madrid') regionEnglish = 'Madrid'
    if (regionEnglish === 'Comunidad Foral de Navarra') regionEnglish = 'Navarra'
    if (regionEnglish === 'Comunidad Valenciana') regionEnglish = 'C. Valenciana'
    if (regionEnglish === 'Islas Baleares') regionEnglish = 'Baleares'
    if (regionEnglish === 'Islas Canarias') regionEnglish = 'Canarias'
    if (regionEnglish === 'Principado de Asturias') regionEnglish = 'Asturias'
    if (regionEnglish === 'Región de Murcia') regionEnglish = 'Murcia'

    const region = en2zh[regionEnglish]

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region ? region : regionEnglish

    if (region in output_spain) {
        geo.properties.REGION = `西班牙.${region}`
    }

    if (regionEnglish === 'Ceuta y Melilla') geo.properties.REGION = '西班牙.梅利利亚'
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
