const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/albania-data/data'
const data_subfolders = fs.readdirSync(data_folder)

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_albania = {}
output_albania = {
    ENGLISH: 'Albania',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

data_subfolders.forEach((date) => {
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    const data_file = `${data_folder}/${date}/district_summary.csv`
    const data = fs.readFileSync(data_file, 'utf8').split(/\r?\n/)
    data.forEach((line, index) => {
        if (index === 0 || line === '') return
        const lineSplit = line.split(',')

        const regionEnglish = lineSplit[1]
        const region = en2zh[regionEnglish]
        const confirmedCount = parseInt(lineSplit[7], 10)
        const deadCount = parseInt(lineSplit[11], 10)
        const curedCount = parseInt(lineSplit[8], 10)
        assert(region != null, `${regionEnglish} does not exist!`)

        if (!(region in output_albania)) {
            output_albania[region] = { ENGLISH: regionEnglish, confirmedCount: {}, curedCount: {}, deadCount: {} }
        }
        output_albania[region]['confirmedCount'][date] = confirmedCount
        output_albania[region]['deadCount'][date] = deadCount
        output_albania[region]['curedCount'][date] = curedCount
    })
})

fs.writeFileSync(`public/data/albania.json`, JSON.stringify(output_albania))

// modify map
const mapName = 'gadm36_ALB_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    if (regionEnglish === 'Korçë') regionEnglish = 'Korçe'

    const region = en2zh[regionEnglish]
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_albania) {
        geo.properties.REGION = `阿尔巴尼亚.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
