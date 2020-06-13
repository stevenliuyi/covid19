const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/korea-data'
const data_file = 'kr_regional_daily.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))
en2zh['Lazaretto'] = '隔离'

const koreaRegions = {
    서울: 'Seoul',
    부산: 'Busan',
    대구: 'Daegu',
    인천: 'Incheon',
    광주: 'Gwangju',
    대전: 'Daejeon',
    울산: 'Ulsan',
    세종: 'Sejong',
    경기: 'Gyeonggi-do',
    강원: 'Gangwon-do',
    충북: 'Chungcheongbuk-do',
    충남: 'Chungcheongnam-do',
    전북: 'Jeollabuk-do',
    전남: 'Jeollanam-do',
    경북: 'Gyeongsangbuk-do',
    경남: 'Gyeongsangnam-do',
    제주: 'Jeju-do',
    검역: 'Lazaretto'
}

let output_korea = {
    ENGLISH: 'South Korea',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

Object.keys(koreaRegions).forEach((regionKr) => {
    const regionEnglish = koreaRegions[regionKr]
    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    output_korea[region] = {
        ENGLISH: regionEnglish,
        confirmedCount: {},
        curedCount: {},
        deadCount: {}
    }
})

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

data.forEach((line, index) => {
    if (index === 0 || line === '') return
    const lineSplit = line.split(',')

    const date = `${lineSplit[0].slice(0, 4)}-${lineSplit[0].slice(4, 6)}-${lineSplit[0].slice(6, 8)}`
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    let regionEnglish = koreaRegions[lineSplit[1]]
    assert(regionEnglish != null, `${regionEnglish} does not exist!`)

    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    const confirmedCount = parseInt(lineSplit[2], 10)
    const deadCount = parseInt(lineSplit[3], 10)
    const curedCount = parseInt(lineSplit[4], 10)

    output_korea[region]['confirmedCount'][date] = confirmedCount
    output_korea[region]['deadCount'][date] = deadCount
    output_korea[region]['curedCount'][date] = curedCount
})

fs.writeFileSync(`public/data/korea.json`, JSON.stringify(output_korea))

// modify map
const mapName = 'gadm36_KOR_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    if (regionEnglish === 'Jeju') regionEnglish = 'Jeju-do'

    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region
    geo.properties.REGION = `韩国.${region}`
})
map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
