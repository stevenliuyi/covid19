const fs = require('fs')
const assert = require('assert')

const confirmed_data_file = 'data/chile-data/chile_confirmed.csv'
const deaths_data_file = 'data/chile-data/chile_deaths.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_chile = {}
output_chile = {
    ENGLISH: 'Chile',
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

            output_chile[region] = {
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
            output_chile[region]['confirmedCount'][date] = count
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
        output_chile[region]['deadCount'][date] = count
    })
})

// calculate cumulative data
regions.forEach((regionEnglish) => {
    const region = en2zh[regionEnglish]
    const dates = Object.keys(output_chile[region]['confirmedCount'])

    dates.forEach((date, i) => {
        if (i > 0) output_chile[region]['confirmedCount'][date] += output_chile[region]['confirmedCount'][dates[i - 1]]
        if (i > 0) output_chile[region]['deadCount'][date] += output_chile[region]['deadCount'][dates[i - 1]]
    })
})

fs.writeFileSync(`public/data/chile.json`, JSON.stringify(output_chile))

// modify map
const mapName = 'gadm36_CHL_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    if (regionEnglish === 'Aisén del General Carlos Ibáñez del Campo') regionEnglish = 'Aysén'
    if (regionEnglish === 'Bío-Bío') regionEnglish = 'Biobío'
    if (regionEnglish === "Libertador General Bernardo O'Higgins") regionEnglish = "O'Higgins"
    if (regionEnglish === 'Magallanes y Antártica Chilena') regionEnglish = 'Magallanes'
    if (regionEnglish === 'Región Metropolitana de Santiago') regionEnglish = 'Santiago Metropolitan'

    const region = en2zh[regionEnglish]
    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region
    assert(region != null, `${regionEnglish} does not exist!`)

    if (region in output_chile) {
        geo.properties.REGION = `智利.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
