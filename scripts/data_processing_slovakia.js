const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/slovakia-data'
const data_file = 'raw.json'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_slovakia = {
    ENGLISH: 'Slovakia',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const name_changes = {
    'Bratislavský kraj': 'Bratislava',
    'Košický kraj': 'Košice',
    'Žilinský kraj': 'Žilina',
    'Prešovský kraj': 'Prešov',
    'Trenčiansky kraj': 'Trenčín',
    'Trnavský kraj': 'Trnava',
    'Nitriansky kraj': 'Nitra',
    'Banskobystrický kraj': 'Banská Bystrica'
}

const data = JSON.parse(fs.readFileSync(`${data_folder}/${data_file}`))
data.forEach((record, index) => {
    if (!('infectedByCounty' in record)) return

    //const date = record.lastUpdatedAtApify
    //console.log(date)
    if (record.dataByDates == null || record.dataByDates.length === 0) return
    const date = record.dataByDates.pop().date.slice(0, 10)
    const regionData = record.infectedByCounty
    regionData.forEach((x) => {
        const regionEnglish = name_changes[x.county]
        assert(regionEnglish != null, `${regionEnglish} does not exist!`)

        const region = en2zh[regionEnglish]
        assert(regionEnglish != null, `${regionEnglish} does not exist!`)

        const confirmedCount = parseInt(x.infectedCount, 10)

        if (!(region in output_slovakia)) {
            output_slovakia[region] = {
                ENGLISH: regionEnglish,
                confirmedCount: {},
                curedCount: {},
                deadCount: {}
            }
        }
        output_slovakia[region]['confirmedCount'][date] = confirmedCount
    })
})

fs.writeFileSync(`public/data/slovakia.json`, JSON.stringify(output_slovakia))

// modify map
const mapName = 'gadm36_SVK_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

const map_name_changes = {
    Bratislavský: 'Bratislava',
    Košický: 'Košice',
    Žilinský: 'Žilina',
    Prešovský: 'Prešov',
    Trenčiansky: 'Trenčín',
    Trnavský: 'Trnava',
    Nitriansky: 'Nitra',
    Banskobystrický: 'Banská Bystrica'
}

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    if (regionEnglish in map_name_changes) regionEnglish = map_name_changes[regionEnglish]

    const region = en2zh[regionEnglish]
    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region
    assert(region != null, `${regionEnglish} does not exist!`)

    if (region in output_slovakia) {
        geo.properties.REGION = `斯洛伐克.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
