const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/switzerland-data'
const data_file = 'covid19_cases_switzerland.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

const cantons = {
    AG: 'Aargau',
    AR: 'Appenzell Ausserrhoden',
    AI: 'Appenzell Innerrhoden',
    BL: 'Basel-Landschaft',
    BS: 'Basel-Stadt',
    BE: 'Bern',
    FR: 'Fribourg',
    GE: 'Genève',
    GL: 'Glarus',
    GR: 'Graubünden',
    JU: 'Jura',
    LU: 'Luzern',
    NE: 'Neuchâtel',
    NW: 'Nidwalden',
    OW: 'Obwalden',
    SG: 'St. Gallen',
    SH: 'Schaffhausen',
    SZ: 'Schwyz',
    SO: 'Solothurn',
    TG: 'Thurgau',
    TI: 'Ticino',
    UR: 'Uri',
    VS: 'Valais',
    VD: 'Vaud',
    ZG: 'Zug',
    ZH: 'Zürich',
    CH: 'Switzerland'
}

let output_switzerland = {}
output_switzerland = {
    ENGLISH: 'Switzerland',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

let date = null
let prevDate = null
let regions = []
data.forEach((line, index) => {
    if (line === '') return
    const lineSplit = line.split(',')

    if (index === 0) {
        regions = lineSplit.slice(1)
        regions.forEach((x) => {
            const regionEnglish = cantons[x]
            if (x !== 'CH') {
                output_switzerland[en2zh[regionEnglish]] = {
                    ENGLISH: regionEnglish,
                    confirmedCount: {},
                    deadCount: {},
                    curedCount: {}
                }
            }
        })
    } else {
        date = lineSplit[0]
        assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

        regions.forEach((x, i) => {
            const regionEnglish = cantons[x]
            const region = en2zh[regionEnglish]
            let count = parseInt(lineSplit[i + 1], 10)

            if (x !== 'CH') {
                if (isNaN(count)) count = output_switzerland[region]['confirmedCount'][prevDate]

                output_switzerland[region]['confirmedCount'][date] = count
            } else {
                output_switzerland['confirmedCount'][date] = count
            }
        })

        prevDate = date
    }
})

fs.writeFileSync(`public/data/switzerland.json`, JSON.stringify(output_switzerland))

// modify map
const mapName = 'gadm36_CHE_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1

    if (regionEnglish === 'Lucerne') regionEnglish = 'Luzern'
    if (regionEnglish === 'Sankt Gallen') regionEnglish = 'St. Gallen'

    const region = en2zh[regionEnglish]

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region
    geo.properties.REGION = `瑞士.${region}`
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
