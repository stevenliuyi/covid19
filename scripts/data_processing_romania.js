const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/romania-data/ro_covid_19_time_series'
const data_file = 'ro_covid_19_time_series.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

en2zh['Not identified'] = '未明确'

let output_romania = {
    ENGLISH: 'Romania',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

data.forEach((line, index) => {
    if (line === '' || index === 0) return
    const lineSplit = line.split(',')

    const date = lineSplit[3]
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    let regionEnglish = lineSplit[1]
    if (regionEnglish === 'Mun. București') regionEnglish = 'București'
    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    if (!(region in output_romania)) {
        output_romania[region] = {
            ENGLISH: regionEnglish,
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }
    }

    const confirmedCount = parseInt(lineSplit[2], 10)
    output_romania[region]['confirmedCount'][date] = confirmedCount
})

fs.writeFileSync(`public/data/romania.json`, JSON.stringify(output_romania))

// modify map
const mapName = 'gadm36_ROU_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    if (regionEnglish === 'Bucharest') regionEnglish = 'București'

    const region = en2zh[regionEnglish]
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_romania) {
        geo.properties.REGION = `罗马尼亚.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
