const fs = require('fs')
const assert = require('assert')

const region_data_file = 'data/italy-dpc-data/dati-regioni/dpc-covid19-ita-regioni.csv'
const province_data_file = 'data/italy-dpc-data/dati-json/dpc-covid19-ita-province.json'

// translations
const en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))
const italy_provinces = JSON.parse(fs.readFileSync('data/map-translations/italy_provinces.json'))

let output_italy = {}
output_italy = {
    ENGLISH: 'Italy',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const region_data = fs.readFileSync(region_data_file, 'utf8').split(/\r?\n/)

const name_changes = {
    'P.A. Trento': 'Trentino-Alto Adige',
    'P.A. Bolzano': 'Trentino-Alto Adige',
    'Friuli Venezia Giulia': 'Friuli V. G.'
}
region_data.forEach((line, index) => {
    if (index === 0 || line === '') return

    const lineSplit = line.split(',')
    const date = lineSplit[0].slice(0, 10)
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    let regionEnglish = lineSplit[3].trim()
    if (regionEnglish in name_changes) regionEnglish = name_changes[regionEnglish]
    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    const confirmedCount = parseInt(lineSplit[10], 10)
    const curedCount = parseInt(lineSplit[12], 10)
    const deadCount = parseInt(lineSplit[13], 10)

    // initialization
    if (!(region in output_italy)) {
        output_italy[region] = { ENGLISH: regionEnglish, confirmedCount: {}, curedCount: {}, deadCount: {} }
    }

    if (!(date in output_italy[region]['confirmedCount'])) {
        output_italy[region]['confirmedCount'][date] = confirmedCount
        output_italy[region]['curedCount'][date] = curedCount
        output_italy[region]['deadCount'][date] = deadCount
    } else {
        output_italy[region]['confirmedCount'][date] += confirmedCount
        output_italy[region]['curedCount'][date] += curedCount
        output_italy[region]['deadCount'][date] += deadCount
    }

    if (!(date in output_italy['confirmedCount'])) {
        output_italy['confirmedCount'][date] = confirmedCount
        output_italy['curedCount'][date] = curedCount
        output_italy['deadCount'][date] = deadCount
    } else {
        output_italy['confirmedCount'][date] += confirmedCount
        output_italy['curedCount'][date] += curedCount
        output_italy['deadCount'][date] += deadCount
    }
})

const province_data = JSON.parse(fs.readFileSync(province_data_file))

province_data.forEach((record) => {
    const date = record.data.slice(0, 10)
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    let regionEnglish = record.denominazione_regione
    if (regionEnglish in name_changes) regionEnglish = name_changes[regionEnglish]
    const region = en2zh[regionEnglish]
    const provinceCode = record.codice_provincia
    const provinceEnglish = provinceCode < 900 ? italy_provinces[provinceCode].en : 'Unassigned'
    const province = provinceCode < 900 ? italy_provinces[provinceCode].zh : '未明确'
    assert(province != null, `${record.denominazione_provincia} does not exist!`)

    const confirmedCount = parseInt(record.totale_casi, 10)

    if (!(province in output_italy[region])) {
        output_italy[region][province] = { ENGLISH: provinceEnglish, confirmedCount: {}, curedCount: {}, deadCount: {} }
    }

    if (!(date in output_italy[region][province]['confirmedCount'])) {
        output_italy[region][province]['confirmedCount'][date] = confirmedCount
    } else {
        output_italy[region][province]['confirmedCount'][date] += confirmedCount
    }
})

fs.writeFileSync(`public/data/italy.json`, JSON.stringify(output_italy))

// modify map
// regions
let mapName = 'gadm36_ITA_1'
let map = JSON.parse(fs.readFileSync(`public/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1

    if (regionEnglish === 'Emilia-Romagna') regionEnglish = 'Emilia Romagna'
    if (regionEnglish === 'Friuli-Venezia Giulia') regionEnglish = 'Friuli V. G.'
    if (regionEnglish === 'Sicily') regionEnglish = 'Sicilia'

    const region = en2zh[regionEnglish]

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region
    geo.properties.REGION = `意大利.${region}`
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))

// provinces
mapName = 'italy_provinces'
map = JSON.parse(fs.readFileSync(`public/maps/${mapName}.json`))
geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    const provinceCode = geo.properties.prov_istat_code_num
    const provinceEnglish = italy_provinces[provinceCode].en
    const province = italy_provinces[provinceCode].zh

    let regionEnglish = geo.properties.reg_name
    if (regionEnglish === "Valle d'Aosta/Vallée d'Aoste") regionEnglish = "Valle d'Aosta"
    if (regionEnglish === 'Emilia-Romagna') regionEnglish = 'Emilia Romagna'
    if (regionEnglish === 'Friuli-Venezia Giulia') regionEnglish = 'Friuli V. G.'
    if (regionEnglish === 'Trentino-Alto Adige/Südtirol') regionEnglish = 'Trentino-Alto Adige'
    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    geo.properties.prov_name = provinceEnglish
    geo.properties.CHINESE_NAME = province
    geo.properties.REGION_CHINESE_NAME = region
    geo.properties.REGION = `意大利.${region}.${province}`
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
