const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/bangladesh-data'
const data_file = 'bangladesh.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_bangladesh = {
    ENGLISH: 'Bangladesh',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

data.forEach((line, index) => {
    if (line === '' || index === 0) return
    const lineSplit = line.split(',')

    const date = lineSplit[0]
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    const confirmedCount = parseInt(lineSplit[2], 10)

    const regionEnglish = lineSplit[1]
    const region = en2zh[regionEnglish]
    assert(region != null, `${lineSplit[1]} does not exist!`)

    if (!(region in output_bangladesh)) {
        output_bangladesh[region] = {
            ENGLISH: regionEnglish,
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }
    }

    output_bangladesh[region]['confirmedCount'][date] = confirmedCount
})

fs.writeFileSync(`public/data/bangladesh.json`, JSON.stringify(output_bangladesh))

// modify map
const mapName = 'BGD'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
const objectName = 'bgd_admbnda_adm1_bbs_20180410'
let geometries = map.objects[objectName].geometries

geometries.forEach((geo) => {
    const regionEnglish = geo.properties.ADM1_EN
    const region = en2zh[regionEnglish]
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)

    geo.properties.CHINESE_NAME = region

    if (region in output_bangladesh) {
        geo.properties.REGION = `孟加拉国.${region}`
    }
})

map.objects[objectName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
