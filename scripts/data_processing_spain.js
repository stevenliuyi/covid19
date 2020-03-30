const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/spain-data/COVID 19'
const data_files = {
    confirmedCount: 'ccaa_covid19_casos.csv',
    deadCount: 'ccaa_covid19_fallecidos.csv',
    curedCount: 'ccaa_covid19_altas.csv'
}

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_spain = {}
output_spain = {
    ENGLISH: 'Spain',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}
;[ 'confirmedCount', 'curedCount', 'deadCount' ].forEach((metric) => {
    const data = fs.readFileSync(`${data_folder}/${data_files[metric]}`, 'utf8').split(/\r?\n/)

    let dates = []
    data.forEach((line, index) => {
        const lineSplit = line.split(',')
        if (index === 0) {
            // dates
            dates = lineSplit.slice(2)
        } else {
            if (lineSplit.length === 1) return

            const regionEnglish = lineSplit[1]
            const region = en2zh[regionEnglish]

            assert(regionEnglish === 'Total' || region != null, `${regionEnglish} does not exist!`)
            const counts = lineSplit.slice(2).map((x) => parseInt(x, 10))

            if (regionEnglish !== 'Total' && !(region in output_spain)) {
                output_spain[region] = {
                    ENGLISH: regionEnglish,
                    confirmedCount: {},
                    curedCount: {},
                    deadCount: {}
                }
            }

            dates.forEach((date, i) => {
                assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)
                if (regionEnglish !== 'Total') {
                    output_spain[region][metric][date] = counts[i]
                } else {
                    output_spain[metric][date] = counts[i]
                }
            })
        }
    })
})

fs.writeFileSync(`public/data/spain.json`, JSON.stringify(output_spain))

// modify map
const mapName = 'gadm36_ESP_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1

    if (regionEnglish === 'Comunidad de Madrid') regionEnglish = 'Madrid'
    if (regionEnglish === 'Comunidad Foral de Navarra') regionEnglish = 'Navarra'
    if (regionEnglish === 'Comunidad Valenciana') regionEnglish = 'C. Valenciana'
    if (regionEnglish === 'Islas Baleares') regionEnglish = 'Baleares'
    if (regionEnglish === 'Islas Canarias') regionEnglish = 'Canarias'
    if (regionEnglish === 'Principado de Asturias') regionEnglish = 'Asturias'
    if (regionEnglish === 'Región de Murcia') regionEnglish = 'Murcia'

    const region = en2zh[regionEnglish]

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region ? region : regionEnglish

    if (region in output_spain) {
        geo.properties.REGION = `西班牙.${region}`
    }

    if (regionEnglish === 'Ceuta y Melilla') geo.properties.REGION = '西班牙.梅利利亚'
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
