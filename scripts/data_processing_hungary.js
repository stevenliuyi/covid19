const fs = require('fs')
const assert = require('assert')

const data_file = 'data/hungary-data/data.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_hungary = {}
output_hungary = {
    ENGLISH: 'Hungary',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const data = fs.readFileSync(data_file, 'utf8').split(/\r?\n/)

let regions = []

data.forEach((line, index) => {
    if (line === '') return
    const lineSplit = line.split(',')

    if (index === 0) {
        regions = lineSplit.slice(1)
        regions.forEach((regionEnglish) => {
            const region = en2zh[regionEnglish]
            assert(region != null, `${regionEnglish} does not exist!`)

            output_hungary[region] = {
                ENGLISH: regionEnglish,
                confirmedCount: {},
                deadCount: {},
                curedCount: {}
            }
        })
    } else {
        const date = lineSplit[0]
        assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

        regions.forEach((regionEnglish, i) => {
            const confirmedCount = parseInt(lineSplit[i + 1], 10)
            const region = en2zh[regionEnglish]
            output_hungary[region]['confirmedCount'][date] = confirmedCount
        })
    }
})

fs.writeFileSync(`public/data/hungary.json`, JSON.stringify(output_hungary))

// modify map
const mapName = 'gadm36_HUN_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1

    if (regionEnglish === 'Csongrád') regionEnglish = 'Csongrád-Csanád'
    if (regionEnglish === 'Gyor-Moson-Sopron') regionEnglish = 'Győr-Moson-Sopron'

    const region = en2zh[regionEnglish]

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region
    assert(region != null, `${regionEnglish} does not exist!`)

    if (region in output_hungary) {
        geo.properties.REGION = `匈牙利.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
