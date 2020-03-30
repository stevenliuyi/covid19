const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/eu-data/dataset'
const data_file = 'covid-19-cz.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))
en2zh['Unassigned'] = '未明确'

const cz2en = {
    'Liberecký kraj': 'Liberec',
    'Pardubický kraj': 'Pardubice',
    'Jihočeský kraj': 'South Bohemian',
    'Královéhradecký kraj': 'Hradec Králové',
    'Karlovarský kraj': 'Karlovy Vary',
    'Kraj Vysočina': 'Vysočina',
    'Ústecký kraj': 'Ústí nad Labem',
    'Plzeňský kraj': 'Plzeň',
    'Zlínský kraj': 'Zlín',
    'Jihomoravský kraj': 'South Moravian',
    'Olomoucký kraj': 'Olomouc',
    'Moravskoslezský kraj': 'Moravian-Silesian',
    'Středočeský kraj': 'Central Bohemian',
    'Hlavní město Praha': 'Prague',
    Nezjištěno: 'Unassigned'
}

let output_czechia = {}
output_czechia = {
    ENGLISH: 'Czechia',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

data.forEach((line, index) => {
    if (index === 0 || line === '') return
    const lineSplit = line.split(',')

    let regionEnglish = cz2en[lineSplit[1]] ? cz2en[lineSplit[1]] : lineSplit[1]
    const confirmedCount = parseInt(lineSplit[2], 10)
    const date = lineSplit[3].slice(0, 10)
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    if (date === '2020-03-13') return

    let region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    if (!(region in output_czechia)) {
        output_czechia[region] = { ENGLISH: regionEnglish, confirmedCount: {}, curedCount: {}, deadCount: {} }
    }
    output_czechia[region]['confirmedCount'][date] = confirmedCount
})

fs.writeFileSync(`public/data/czechia.json`, JSON.stringify(output_czechia))

// modify map
const mapName = 'gadm36_CZE_1'
let map = JSON.parse(fs.readFileSync(`public/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = `${geo.properties.NAME_1} kraj`
    if (regionEnglish.includes('Vysočina')) regionEnglish = 'Kraj Vysočina'
    if (regionEnglish.includes('Prague')) regionEnglish = 'Hlavní město Praha'
    regionEnglish = cz2en[regionEnglish]

    const region = en2zh[regionEnglish]
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_czechia) {
        geo.properties.REGION = `捷克.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
