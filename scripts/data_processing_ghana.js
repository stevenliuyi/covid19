const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/ghana-data/history'

let data_files = fs.readdirSync(data_folder)
data_files = data_files.filter((filename) => filename.endsWith('.txt'))
data_files.sort()

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_ghana = {
    ENGLISH: 'Ghana',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const regions = [
    'Greater Accra',
    'Ashanti',
    'Western',
    'Central',
    'Eastern',
    'Volta',
    'Western North',
    'Oti',
    'Upper East',
    'Northern',
    'Upper West',
    'Bono East',
    'North East',
    'Savannah',
    'Bono',
    'Ahafo'
]

regions.forEach((regionEnglish) => {
    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    output_ghana[region] = {
        ENGLISH: regionEnglish,
        confirmedCount: {},
        deadCount: {},
        curedCount: {}
    }
})

data_files.forEach((data_file) => {
    const date = data_file.slice(0, 10)
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

    data.forEach((line) => {
        if (line === '' || line.startsWith('http')) return

        const lineSplit = line.split('–').map((x) => x.trim())
        const regionEnglish = lineSplit[0].replace(' Region', '')
        const region = en2zh[regionEnglish]
        assert(region != null, `${regionEnglish} does not exist!`)

        const confirmedCount = parseInt(lineSplit[1].replace(',', ''), 10)
        assert(!isNaN(confirmedCount), `${lineSplit[1]} is not a valid count!`)

        output_ghana[region]['confirmedCount'][date] = confirmedCount
    })
})

fs.writeFileSync(`public/data/ghana.json`, JSON.stringify(output_ghana))

// modify map
//const mapName = 'gadm36_GHA_1'
//let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
//let geometries = map.objects[mapName].geometries
//
//geometries.forEach((geo) => {
//    let regionEnglish = geo.properties.NAME_1
//
//    const region = en2zh[regionEnglish]
//    geo.properties.NAME_1 = regionEnglish
//    geo.properties.CHINESE_NAME = region
//    assert(region != null, `${regionEnglish} does not exist!`)
//
//    if (region in output_ghana) {
//        geo.properties.REGION = `加纳.${region}`
//    }
//})
//
//map.objects[mapName].geometries = geometries
//fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
//
