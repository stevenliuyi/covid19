const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/italy-dpc-data/dati-regioni'
const data_file = 'dpc-covid19-ita-regioni.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_italy = {}
output_italy = {
    ENGLISH: 'Italy',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

data.forEach((line, index) => {
    if (index === 0 || line === '') return

    const lineSplit = line.split(',')
    const date = lineSplit[0].slice(0, 10)
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    let regionEnglish = lineSplit[3].trim()
    const confirmedCount = parseInt(lineSplit[10], 10)
    const curedCount = parseInt(lineSplit[12], 10)
    const deadCount = parseInt(lineSplit[13], 10)

    if ([ 'P.A. Trento', 'P.A. Bolzano' ].includes(regionEnglish)) {
        regionEnglish = 'Trentino-Alto Adige'
    }
    if (regionEnglish === 'Friuli Venezia Giulia') regionEnglish = 'Friuli V. G.'

    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)
    // initialization
    if (!(region in output_italy)) {
        output_italy[region] = { ENGLISH: regionEnglish, confirmedCount: {}, curedCount: {}, deadCount: {} }
    }

    if (!(date in output_italy[region]['confirmedCount'])) {
        output_italy[region]['confirmedCount'][date] = confirmedCount
        output_italy[region]['curedCount'][date] = curedCount
        output_italy[region]['deadCount'][date] = deadCount
    } else {
        output_italy[region]['confirmedCount'][date] += confirmedCount
        output_italy[region]['curedCount'][date] += curedCount
        output_italy[region]['deadCount'][date] += deadCount
    }

    if (!(date in output_italy['confirmedCount'])) {
        output_italy['confirmedCount'][date] = confirmedCount
        output_italy['curedCount'][date] = curedCount
        output_italy['deadCount'][date] = deadCount
    } else {
        output_italy['confirmedCount'][date] += confirmedCount
        output_italy['curedCount'][date] += curedCount
        output_italy['deadCount'][date] += deadCount
    }
})

fs.writeFileSync(`public/data/italy.json`, JSON.stringify(output_italy))

// modify map
const mapName = 'gadm36_ITA_1'
let map = JSON.parse(fs.readFileSync(`public/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1

    if (regionEnglish === 'Emilia-Romagna') regionEnglish = 'Emilia Romagna'
    if (regionEnglish === 'Friuli-Venezia Giulia') regionEnglish = 'Friuli V. G.'
    if (regionEnglish === 'Sicily') regionEnglish = 'Sicilia'

    const region = en2zh[regionEnglish]

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region
    geo.properties.REGION = `意大利.${region}`
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
