const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/south-africa-data/data'
const data_file = 'covid19za_provincial_cumulative_timeline_confirmed.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))
en2zh['Unknown'] = '未知地区'

// provinces
const provinces = {
    EC: 'Eastern Cape',
    FS: 'Free State',
    GP: 'Gauteng',
    KZN: 'KwaZulu-Natal',
    LP: 'Limpopo',
    MP: 'Mpumalanga',
    NC: 'Northern Cape',
    NW: 'North West',
    WC: 'Western Cape',
    UNKNOWN: 'Unknown'
}

let output_za = {}
output_za = {
    ENGLISH: 'South Africa',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

let regions = {}
data.forEach((line, index) => {
    if (line === '') return
    const lineSplit = line.split(',')

    if (index === 0) {
        regions = lineSplit.slice(2, -1).map((x) => provinces[x])
        regions.forEach((regionEnglish) => {
            const region = en2zh[regionEnglish]
            assert(region != null, `${regionEnglish} does not exist!`)
            output_za[region] = {
                ENGLISH: regionEnglish,
                confirmedCount: {},
                curedCount: {},
                deadCount: {}
            }
        })
    } else {
        const date = lineSplit[0].split('-').reverse().join('-')
        assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

        regions.forEach((regionEnglish, i) => {
            const region = en2zh[regionEnglish]
            const confirmedCount = parseInt(lineSplit[i + 2], 10)
            if (!isNaN(confirmedCount)) {
                output_za[region]['confirmedCount'][date] = confirmedCount
            }
        })
    }
})

fs.writeFileSync(`public/data/south_africa.json`, JSON.stringify(output_za))

// modify map
const mapName = 'gadm36_ZAF_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_za) {
        geo.properties.REGION = `南非.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
