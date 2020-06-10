const fs = require('fs')
const assert = require('assert')

// direct data API: https://api-covid19.rnbo.gov.ua/data?to=2020-06-04

const data_folder = 'data/ukraine-data/daily_reports'

let data_files = fs.readdirSync(data_folder)
data_files = data_files.filter((filename) => filename.endsWith('.csv'))
data_files.sort()

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_ukraine = {
    ENGLISH: 'Ukraine',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const regions = [
    'Vinnytsia',
    'Volyn',
    'Dnipropetrovsk',
    'Donetsk',
    'Zhytomyr',
    'Zakarpattia',
    'Zaporizhzhya',
    'Ivano-Frankivsk',
    'Kirovohrad',
    'Kiev City',
    'Kiev',
    'Lviv',
    'Luhansk',
    'Mykolaiv',
    'Odessa',
    'Poltava',
    'Rivne',
    'Sumy',
    'Ternopil',
    'Kharkiv',
    'Kherson',
    'Khmelnytskyi',
    'Chernivtsi',
    'Cherkasy',
    'Chernihiv'
]

regions.forEach((regionEnglish) => {
    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)
    output_ukraine[region] = {
        ENGLISH: regionEnglish,
        confirmedCount: {},
        deadCount: {},
        curedCount: {}
    }
})

const name_changes = {
    Volynska: 'Volyn',
    Dnipropetrovska: 'Dnipropetrovsk',
    Donetska: 'Donetsk',
    Zhytomyrskа: 'Zhytomyr',
    Zakarpatska: 'Zakarpattia',
    Zaporizka: 'Zaporizhzhya',
    'Ivano-Frankivska': 'Ivano-Frankivsk',
    Kyivska: 'Kiev',
    Kirovohradska: 'Kirovohrad',
    Luhanska: 'Luhansk',
    Lvivska: 'Lviv',
    Mykolaivska: 'Mykolaiv',
    Odeska: 'Odessa',
    Poltavska: 'Poltava',
    Rivnenska: 'Rivne',
    Sumska: 'Sumy',
    Ternopilska: 'Ternopil',
    Kharkivska: 'Kharkiv',
    Khersonska: 'Kherson',
    Khmelnytska: 'Khmelnytskyi',
    Cherkaska: 'Cherkasy',
    Chernivetska: 'Chernivtsi',
    Chernihivska: 'Chernihiv'
}

data_files.forEach((data_file) => {
    const date = `${data_file.slice(6, 10)}-${data_file.slice(0, 5)}`
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

    data.forEach((line, index) => {
        if (line === '' || index === 0) return
        const lineSplit = line.split(',')

        let regionEnglish = lineSplit[2]
        if (regionEnglish in name_changes) regionEnglish = name_changes[regionEnglish]
        if (lineSplit[1] === 'Kyiv') regionEnglish = 'Kiev City'

        const region = en2zh[regionEnglish]
        assert(region != null, `${regionEnglish} does not exist!`)

        const confirmedCount = parseInt(lineSplit[7], 10)
        const deadCount = parseInt(lineSplit[8], 10)
        const curedCount = parseInt(lineSplit[9], 10)

        output_ukraine[region]['confirmedCount'][date] = confirmedCount
        output_ukraine[region]['deadCount'][date] = deadCount
        output_ukraine[region]['curedCount'][date] = curedCount
    })
})

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
