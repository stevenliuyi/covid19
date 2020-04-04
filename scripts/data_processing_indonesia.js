const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/indonesia-data'
const data_file = 'data_provinsi.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_indonesia = {
    ENGLISH: 'Indonesia',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

const months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ]

let dates = []
data.forEach((line, index) => {
    if (line === '' || index === 0) return
    const lineSplit = line.split(',')
    if (index === 1) {
        dates = lineSplit.slice(6).map((x) => {
            const day = x.split('-')[0]
            const month = months.findIndex((m) => m === x.split('-')[1])
            const date = new Date(2020, month, day).toISOString().slice(0, 10)
            return date
        })
    } else if (index <= 35) {
        const regionEnglish = lineSplit[1]
        const region = en2zh[regionEnglish]
        assert(region != null, `${regionEnglish} does not exist!`)

        output_indonesia[region] = {
            ENGLISH: regionEnglish,
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }

        dates.forEach((date, idx) => {
            const confirmedCount = parseInt(lineSplit[6 + idx], 10)
            if (!isNaN(confirmedCount)) {
                output_indonesia[region]['confirmedCount'][date] = confirmedCount
            }
        })
    }
})

fs.writeFileSync(`public/data/indonesia.json`, JSON.stringify(output_indonesia))

// modify map
const mapName = 'gadm36_IDN_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    if (regionEnglish === 'Bangka Belitung') regionEnglish = 'Kepulauan Bangka Belitung'
    if (regionEnglish === 'Jakarta Raya') regionEnglish = 'DKI Jakarta'
    if (regionEnglish === 'Yogyakarta') regionEnglish = 'DI Yogyakarta'

    const region = en2zh[regionEnglish]
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_indonesia) {
        geo.properties.REGION = `印度尼西亚.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
