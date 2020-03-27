const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/malaysia-data/states'
const confirmed_data_file = 'covid-19-my-states-cases.csv'
const death_data_file = 'covid-19-my-states-death.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_malaysia = {}
output_malaysia = {
    ENGLISH: 'Malaysia',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const confirmed_data = fs.readFileSync(`${data_folder}/${confirmed_data_file}`, 'utf8').split(/\r?\n/)
const death_data = fs.readFileSync(`${data_folder}/${death_data_file}`, 'utf8').split(/\r?\n/)

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
}

let regions = []
confirmed_data.forEach((line, index) => {
    if (line === '') return
    const lineSplit = line.split(',')

    if (index === 0) {
        regions = lineSplit
            .slice(1)
            .map((x) => x.replace('wp-', '').split('-').map((y) => capitalizeFirstLetter(y)).join(' '))

        regions.forEach((regionEnglish) => {
            const region = en2zh[regionEnglish]
            assert(region != null, `${regionEnglish} does not exist!`)

            output_malaysia[region] = {
                ENGLISH: regionEnglish,
                confirmedCount: {},
                deadCount: {},
                curedCount: {}
            }
        })
    } else {
        const date = lineSplit[0].split('/').map((x) => x.padStart(2, '0')).reverse().join('-')
        assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

        regions.forEach((regionEnglish, i) => {
            const region = en2zh[regionEnglish]
            let confirmedCount = lineSplit[i + 1]
            if (confirmedCount === '' || confirmedCount === '-') return
            confirmedCount = parseInt(confirmedCount, 10)
            output_malaysia[region]['confirmedCount'][date] = confirmedCount
        })
    }
})

death_data.forEach((line, index) => {
    if (line === '' || index === 0) return
    const lineSplit = line.split(',')

    const date = lineSplit[0].split('/').map((x) => x.padStart(2, '0')).reverse().join('-')
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    regions.forEach((regionEnglish, i) => {
        const region = en2zh[regionEnglish]
        let deadCount = lineSplit[i + 1]
        if (deadCount === '' || deadCount === '-') return
        deadCount = parseInt(deadCount, 10)
        output_malaysia[region]['deadCount'][date] = deadCount
    })
})

fs.writeFileSync(`public/data/malaysia.json`, JSON.stringify(output_malaysia))

// modify map
const mapName = 'gadm36_MYS_1'
let map = JSON.parse(fs.readFileSync(`public/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    if (regionEnglish === 'Trengganu') regionEnglish = 'Terengganu'

    const region = en2zh[regionEnglish]
    geo.properties.CHINESE_NAME = region
    assert(region != null, `${regionEnglish} does not exist!`)

    if (region in output_malaysia) {
        geo.properties.REGION = `马来西亚.${region}`
    } else {
        console.log(regionEnglish)
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
