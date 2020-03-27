const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/brazil-data'
const confirmed_data_file = 'confirmed-cases.csv'
const deaths_data_file = 'deaths.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_brazil = {}
output_brazil = {
    ENGLISH: 'Brazil',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const confirmed_data = fs.readFileSync(`${data_folder}/${confirmed_data_file}`, 'utf8').split(/\r?\n/)
const deaths_data = fs.readFileSync(`${data_folder}/${deaths_data_file}`, 'utf8').split(/\r?\n/)

let dates = []
confirmed_data.forEach((line, index) => {
    if (line === '') return
    const lineSplit = line.split(',')

    if (index === 0) {
        dates = lineSplit.slice(2).map((x) => {
            const splitted = x.split('/')
            const date = `2020-${splitted[1].padStart(2, '0')}-${splitted[0].padStart(2, '0')}`
            assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

            return date
        })
    } else {
        const regionEnglish = lineSplit[0]
        const regionAbbr = lineSplit[1]
        if ([ '(N)', '(NE)', '(SE)', '(S)', '(CO)' ].includes(regionAbbr)) return

        const region = en2zh[regionEnglish]
        if (regionAbbr !== 'BR') {
            output_brazil[region] = {
                ENGLISH: regionEnglish,
                confirmedCount: {},
                deadCount: {},
                curedCount: {}
            }
        }
        dates.forEach((d, i) => {
            const confirmedCount = parseInt(lineSplit[i + 2], 10)

            if (regionAbbr === 'BR') {
                output_brazil['confirmedCount'][d] = confirmedCount
            } else {
                output_brazil[region]['confirmedCount'][d] = confirmedCount
            }
        })
    }
})

deaths_data.forEach((line, index) => {
    if (line === '' || index === 0) return
    const lineSplit = line.split(',')

    const regionEnglish = lineSplit[0]
    const regionAbbr = lineSplit[1]
    if ([ '(N)', '(NE)', '(SE)', '(S)', '(CO)' ].includes(regionAbbr)) return

    const region = en2zh[regionEnglish]
    dates.forEach((d, i) => {
        const deadCount = parseInt(lineSplit[i + 2], 10)

        if (regionAbbr === 'BR') {
            output_brazil['deadCount'][d] = deadCount
        } else {
            output_brazil[region]['deadCount'][d] = deadCount
        }
    })
})

fs.writeFileSync(`public/data/brazil.json`, JSON.stringify(output_brazil))

// modify map
const mapName = 'gadm36_BRA_1'
let map = JSON.parse(fs.readFileSync(`public/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1

    if (regionEnglish === 'Espírito Santo') regionEnglish = 'Espirito Santo'
    const region = en2zh[regionEnglish]
    geo.properties.CHINESE_NAME = region
    assert(region != null, `${regionEnglish} does not exist!`)

    if (region in output_brazil) {
        geo.properties.REGION = `巴西.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
