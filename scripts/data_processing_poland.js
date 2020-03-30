const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/eu-data/dataset'
const data_file = 'covid-19-pl.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_poland = {}
output_poland = {
    ENGLISH: 'Poland',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const pl2en = {
    podlaskie: 'Podlaskie',
    świętokrzyskie: 'Świętokrzyskie',
    lubuskie: 'Lubusz',
    opolskie: 'Opole',
    zachodniopomorskie: 'West Pomeranian',
    pomorskie: 'Pomeranian',
    małopolskie: 'Lesser Poland',
    'kujawsko-pomorskie': 'Kuyavian-Pomeranian',
    'warmińsko-mazurskie': 'Warmian-Masurian',
    podkarpackie: 'Podkarpackie',
    wielkopolskie: 'Greater Poland',
    lubelskie: 'Lublin',
    śląskie: 'Silesian',
    dolnośląskie: 'Lower Silesian',
    łódzkie: 'Łódź',
    mazowieckie: 'Masovian'
}

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

data.forEach((line, index) => {
    if (index === 0 || line === '') return
    const lineSplit = line.split(',')
    if (lineSplit[0] === '') return

    let regionEnglish = pl2en[lineSplit[1]] ? pl2en[lineSplit[1]] : lineSplit[1]
    const confirmedCount = parseInt(lineSplit[2], 10)
    const deadCount = parseInt(lineSplit[3], 10)
    const date = lineSplit[4].slice(0, 10)
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    if (regionEnglish === 'sum') {
        output_poland['confirmedCount'][date] = confirmedCount
        output_poland['deadCount'][date] = deadCount
    } else {
        let region = en2zh[regionEnglish]
        assert(region != null, `${regionEnglish} does not exist!`)

        if (!(region in output_poland)) {
            output_poland[region] = { ENGLISH: regionEnglish, confirmedCount: {}, curedCount: {}, deadCount: {} }
        }
        output_poland[region]['confirmedCount'][date] = confirmedCount
        output_poland[region]['deadCount'][date] = deadCount
    }
})

fs.writeFileSync(`public/data/poland.json`, JSON.stringify(output_poland))

// modify map
const mapName = 'gadm36_POL_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    const regionEnglish = pl2en[geo.properties.NAME_1.toLowerCase()]
    const region = en2zh[regionEnglish]
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_poland) {
        geo.properties.REGION = `波兰.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
