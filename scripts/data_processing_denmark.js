const fs = require('fs')
const assert = require('assert')

const confirmed_data_file = 'data/denmark-data/confirmed.csv'
const deaths_data_file = 'data/denmark-data/deaths.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_denmark = {}
output_denmark = {
    ENGLISH: 'Denmark',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const confirmed_data = fs.readFileSync(confirmed_data_file, 'utf8').split(/\r?\n/)
const deaths_data = fs.readFileSync(deaths_data_file, 'utf8').split(/\r?\n/)

let regions = []

confirmed_data.forEach((line, index) => {
    if (line === '') return
    const lineSplit = line.split(',')

    if (index === 0) {
        regions = lineSplit.slice(1)
        regions.forEach((regionEnglish) => {
            const region = en2zh[regionEnglish]
            assert(region != null, `${regionEnglish} does not exist!`)

            output_denmark[region] = {
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
            const count = parseInt(lineSplit[i + 1], 10)
            const region = en2zh[regionEnglish]
            output_denmark[region]['confirmedCount'][date] = count
        })
    }
})

deaths_data.forEach((line, index) => {
    if (line === '' || index === 0) return
    const lineSplit = line.split(',')

    const date = lineSplit[0]
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)
    regions.forEach((regionEnglish, i) => {
        const count = parseInt(lineSplit[i + 1], 10)
        const region = en2zh[regionEnglish]
        output_denmark[region]['deadCount'][date] = count
    })
})

fs.writeFileSync(`public/data/denmark.json`, JSON.stringify(output_denmark))

// modify map
const mapName = 'gadm36_DNK_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1

    const region = en2zh[regionEnglish]
    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region
    assert(region != null, `${regionEnglish} does not exist!`)

    if (region in output_denmark) {
        geo.properties.REGION = `丹麦.丹麦.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
