const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/ukraine-data/data'
const data_file = 'race-auto.json'
const names_file = 'data.json'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_ukraine = {
    ENGLISH: 'Ukraine',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const data = JSON.parse(fs.readFileSync(`${data_folder}/${data_file}`))
const regions = JSON.parse(fs.readFileSync(`${data_folder}/${names_file}`))

regions.forEach((reg) => {
    const regionEnglish = reg.en_name
    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)
    output_ukraine[region] = {
        ENGLISH: regionEnglish,
        confirmedCount: {},
        deadCount: {},
        curedCount: {}
    }
})

Object.keys(data).forEach((unixTime, index) => {
    let date = new Date(parseInt(unixTime, 10))
    date = date.toISOString().substr(0, 10)
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    data[unixTime].forEach((record) => {
        const regionEnglish = record.en_name
        const region = en2zh[regionEnglish]
        const confirmedCount = parseInt(record.value, 10)
        output_ukraine[region]['confirmedCount'][date] = confirmedCount
    })
})

delete output_ukraine['克里米亚']
delete output_ukraine['塞瓦斯托波尔']

fs.writeFileSync(`public/data/ukraine.json`, JSON.stringify(output_ukraine))

// modify map
const mapName = 'gadm36_UKR_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

const map_name_changes = {
    Khmelnytskyy: 'Khmelnytskyi',
    Mykolayiv: 'Mykolaiv',
    Transcarpathia: 'Zakarpattia',
    Vinnytsya: 'Vinnytsia'
}

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1.replace(/'/g, '')
    if (regionEnglish in map_name_changes) regionEnglish = map_name_changes[regionEnglish]

    const region = en2zh[regionEnglish]
    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region
    assert(region != null, `${regionEnglish} does not exist!`)

    if (region in output_ukraine) {
        geo.properties.REGION = `乌克兰.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
