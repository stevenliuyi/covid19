const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/eu-data/dataset'
const data_file = 'covid-19-se.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_sweden = {}
output_sweden = {
    ENGLISH: 'Sweden',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

const name_changes = {
    'Jämtland Härjedalen': 'Jämtland',
    Sörmland: 'Södermanland'
}

data.forEach((line, index) => {
    if (index === 0 || line === '') return
    const lineSplit = line.split(',')

    let regionEnglish = lineSplit[1]
    if (regionEnglish in name_changes) regionEnglish = name_changes[regionEnglish]

    const confirmedCount = parseInt(lineSplit[2], 10)
    const deadCount = parseInt(lineSplit[5], 10)
    const date = lineSplit[7].slice(0, 10)
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    let region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    if (!(region in output_sweden)) {
        output_sweden[region] = { ENGLISH: regionEnglish, confirmedCount: {}, curedCount: {}, deadCount: {} }
    }
    output_sweden[region]['confirmedCount'][date] = confirmedCount
    output_sweden[region]['deadCount'][date] = deadCount
})

fs.writeFileSync(`public/data/sweden.json`, JSON.stringify(output_sweden))

// modify map
const mapName = 'gadm36_SWE_1'
let map = JSON.parse(fs.readFileSync(`public/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    if (regionEnglish === 'Orebro') regionEnglish = 'Örebro'

    const region = en2zh[regionEnglish]
    geo.properties.CHINESE_NAME = region
    assert(region != null, `${regionEnglish} does not exist!`)

    if (region in output_sweden) {
        geo.properties.REGION = `瑞典.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
