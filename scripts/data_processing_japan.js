const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/japan-data/50_Data'
const confirmed_data_file = 'byDate.csv'
const deaths_data_file = 'death.csv'
const prefectures_file = 'prefectures.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))
en2zh['Costa Atlantica'] = '歌诗达大西洋号'

const prefectureData = fs.readFileSync(`${data_folder}/${prefectures_file}`, 'utf8').split(/\r?\n/)
const ja2en = {}
prefectureData.forEach((line, index) => {
    if (index === 0) return
    const lineSplit = line.split(',')
    const jaName = lineSplit[1]
    const enName = lineSplit[2].replace('Prefecture', '').trim()
    ja2en[jaName] = enName
})
ja2en['チャーター便'] = 'Evacuation'
ja2en['検疫職員'] = 'Quarantine Officers'
ja2en['伊客船'] = 'Costa Atlantica'

// initialization
let output_japan = {}
output_japan = {
    ENGLISH: 'Japan',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

// confirmed cases
const data = fs.readFileSync(`${data_folder}/${confirmed_data_file}`, 'utf8').split(/\r?\n/)

let regions = []
let currentDate = ''
data.forEach((line, index) => {
    if (line === '') return

    const lineSplit = line.split(',')
    if (index === 0) {
        regions = lineSplit.slice(1).filter((x) => x !== 'クルーズ船').map((x) => ja2en[x]).map((x) => {
            const region = en2zh[x]
            assert(region != null, `${x} does not exist!`)
            output_japan[region] = {
                ENGLISH: x,
                confirmedCount: {},
                curedCount: {},
                deadCount: {}
            }
            return region
        })
    } else {
        const date = `${lineSplit[0].slice(0, 4)}-${lineSplit[0].slice(4, 6)}-${lineSplit[0].slice(6, 8)}`
        assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)
        const regionCounts = lineSplit.slice(1, lineSplit.length - 1).map((x) => (x !== '' ? parseInt(x, 10) : 0))

        regionCounts.forEach((count, i) => {
            const region = regions[i]
            output_japan[region]['confirmedCount'][date] =
                currentDate !== '' ? output_japan[region]['confirmedCount'][currentDate] + count : count
        })
        currentDate = date
    }
})

// dead cases
const deathData = fs.readFileSync(`${data_folder}/${deaths_data_file}`, 'utf8').split(/\r?\n/)
currentDate = ''
deathData.forEach((line, index) => {
    if (index === 0) return
    const lineSplit = line.split(',')
    const date = `${lineSplit[0].slice(0, 4)}-${lineSplit[0].slice(4, 6)}-${lineSplit[0].slice(6, 8)}`
    const regionCounts = lineSplit.slice(1, lineSplit.length - 1).map((x) => (x !== '' ? parseInt(x, 10) : 0))

    regionCounts.forEach((count, i) => {
        const region = regions[i]
        output_japan[region]['deadCount'][date] =
            currentDate !== '' ? output_japan[region]['deadCount'][currentDate] + count : count
    })
    currentDate = date
})

fs.writeFileSync(`public/data/japan.json`, JSON.stringify(output_japan))

// modify map
const mapName = 'gadm36_JPN_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1

    if (regionEnglish === 'Hyōgo') regionEnglish = 'Hyogo'
    if (regionEnglish === 'Kochi') regionEnglish = 'Kōchi'
    if (regionEnglish === 'Naoasaki') regionEnglish = 'Nagasaki'

    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region
    geo.properties.REGION = `日本.${region}`
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
