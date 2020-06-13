const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/senegal-data/data'
const data_file = 'regions_cas.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_senegal = {}
output_senegal = {
    ENGLISH: 'Senegal',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

let regions = {}

const name_changes = {
    'Saint louis': 'Saint-Louis'
}

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

data.forEach((line, index) => {
    if (line === '') return
    const lineSplit = line.split(',')

    if (index === 0) {
        regions = lineSplit
            .slice(1)
            .map((x) => x.charAt(0) + x.slice(1).toLowerCase())
            .map((x) => (x in name_changes ? name_changes[x] : x))
        regions.forEach((regionEnglish) => {
            const region = en2zh[regionEnglish]
            assert(region != null, `${regionEnglish} does not exist!`)
            output_senegal[region] = {
                ENGLISH: regionEnglish,
                confirmedCount: {},
                curedCount: {},
                deadCount: {}
            }
        })
    } else {
        const date = lineSplit[0].trim()
        assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)
        regions.forEach((regionEnglish, i) => {
            const region = en2zh[regionEnglish]
            const count = parseInt(lineSplit[i + 1], 10)
            if (!isNaN(count)) {
                output_senegal[region]['confirmedCount'][date] = count
            }
        })
    }
})

fs.writeFileSync(`public/data/senegal.json`, JSON.stringify(output_senegal))

// modify map
const mapName = 'gadm36_SEN_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_senegal) {
        geo.properties.REGION = `塞内加尔.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
//
