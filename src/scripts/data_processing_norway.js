const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/eu-data/dataset'
const data_file = 'covid-19-no.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_norway = {}
output_norway = {
    ENGLISH: 'Norway',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

data.forEach((line, index) => {
    if (index === 0 || line === '') return
    const lineSplit = line.split(',')

    let regionEnglish = lineSplit[1]
    if (regionEnglish === 'Unknown county') return

    const confirmedCount = parseInt(lineSplit[2], 10)
    const date = lineSplit[3].slice(0, 10)
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    if (regionEnglish === 'sum') {
        output_norway['confirmedCount'][date] = confirmedCount
    } else {
        let region = en2zh[regionEnglish]
        assert(region != null, `${regionEnglish} does not exist!`)

        if (!(region in output_norway)) {
            output_norway[region] = { ENGLISH: regionEnglish, confirmedCount: {}, curedCount: {}, deadCount: {} }
        }
        output_norway[region]['confirmedCount'][date] = confirmedCount
    }
})

fs.writeFileSync(`public/data/norway.json`, JSON.stringify(output_norway))

// modify map
const mapName = 'gadm36_NOR_1'
let map = JSON.parse(fs.readFileSync(`public/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    if ([ 'Aust-Agder', 'Vest-Agder' ].includes(regionEnglish)) regionEnglish = 'Agder'
    if ([ 'Akershus', 'Buskerud', 'Ãstfold' ].includes(regionEnglish)) regionEnglish = 'Viken'
    if ([ 'Hordaland', 'Sogn og Fjordane' ].includes(regionEnglish)) regionEnglish = 'Vestland'
    if ([ 'Hedmark', 'Oppland' ].includes(regionEnglish)) regionEnglish = 'Innlandet'
    if ([ 'Vestfold', 'Telemark' ].includes(regionEnglish)) regionEnglish = 'Vestfold og Telemark'
    if ([ 'Troms', 'Finnmark' ].includes(regionEnglish)) regionEnglish = 'Troms og Finnmark'
    if ([ 'Nord-Trøndelag', 'Sør-Trøndelag' ].includes(regionEnglish)) regionEnglish = 'Trøndelag'

    const region = en2zh[regionEnglish]
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_norway) {
        geo.properties.REGION = `挪威.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
