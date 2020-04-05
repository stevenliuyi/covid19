const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/saudi-arabia-data'
const data_file = 'covid-sa-by-city.csv'

// translations
const en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

const cities = JSON.parse(fs.readFileSync(`${data_folder}/cities/cities.json`))
const regions = JSON.parse(fs.readFileSync(`${data_folder}/cities/regions.json`))

let output_saudi_arabia = {
    ENGLISH: 'Saudi Arabia',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}
let output_cities = {}

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/).filter((line) => line !== '')

const cityIds = [ ...new Set(data.slice(1).map((line) => line.split(',')[1])) ]
function parseDate(date) {
    const [ year, month, day ] = date.substr(0, 10).split('-')
    return new Date(year, month - 1, day)
}

const firstDate = data[1].slice(0, 10)
const lastDate = data[data.length - 1].slice(0, 10)
assert(!isNaN(new Date(firstDate)), `Date ${firstDate} is not valid!`)
assert(!isNaN(new Date(lastDate)), `Date ${lastDate} is not valid!`)

let currentDate = firstDate
let prevDate = null

while (parseDate(currentDate) <= parseDate(lastDate)) {
    cityIds.forEach((cityId) => {
        const cityObj = cities.find((x) => String(x.city_id) === cityId)
        if (cityObj == null) return

        const city = cityObj.name_en
        const regionId = cityObj.region_id
        const regionObj = regions.find((x) => x.region_id === regionId)
        if (regionObj == null) return
        const regionEnglish = regionObj.name_en
        const region = en2zh[regionEnglish]
        assert(region != null, `${regionEnglish} does not exist!`)

        if (!(region in output_saudi_arabia)) {
            output_saudi_arabia[region] = {
                ENGLISH: regionEnglish,
                confirmedCount: {},
                curedCount: {},
                deadCount: {}
            }
        }

        if (!(city in output_saudi_arabia[region])) {
            output_saudi_arabia[region][city] = {
                ENGLISH: city,
                confirmedCount: {},
                curedCount: {},
                deadCount: {}
            }
        }

        const cityData = data.find((x) => x.slice(0, 10) === currentDate && cityId === x.split(',')[1])

        if (cityData == null) {
            output_saudi_arabia[region][city]['confirmedCount'][currentDate] =
                prevDate != null ? output_saudi_arabia[region][city]['confirmedCount'][prevDate] : 0
        } else {
            const confirmedCount = parseInt(cityData.split(',')[3], 10)
            output_saudi_arabia[region][city]['confirmedCount'][currentDate] = confirmedCount
        }

        if (!(currentDate in output_saudi_arabia[region]['confirmedCount']))
            output_saudi_arabia[region]['confirmedCount'][currentDate] = 0
        output_saudi_arabia[region]['confirmedCount'][currentDate] +=
            output_saudi_arabia[region][city]['confirmedCount'][currentDate]
    })

    // next day
    prevDate = currentDate
    currentDate = parseDate(currentDate)
    currentDate.setDate(currentDate.getDate() + 1)
    currentDate = currentDate.toISOString().slice(0, 10)
}

// remove cities
Object.keys(output_saudi_arabia).forEach((region) => {
    output_saudi_arabia[region] = {
        ENGLISH: output_saudi_arabia[region].ENGLISH,
        confirmedCount: output_saudi_arabia[region].confirmedCount,
        curedCount: output_saudi_arabia[region].curedCount,
        deadCount: output_saudi_arabia[region].deadCount
    }
})

fs.writeFileSync(`public/data/saudi_arabia.json`, JSON.stringify(output_saudi_arabia))

// modify map
const mapName = 'gadm36_SAU_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1.replace('Al ', '')
    if (regionEnglish === '`Asir') regionEnglish = 'Asir'
    if (regionEnglish === 'Hudud ash Shamaliyah') regionEnglish = 'Northern Borders'
    if (regionEnglish === 'Quassim') regionEnglish = 'Qassim'
    if (regionEnglish === 'Ar Riyad') regionEnglish = 'Riyadh'
    if (regionEnglish === 'Ash Sharqiyah') regionEnglish = 'Eastern Province'

    const region = en2zh[regionEnglish]
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_saudi_arabia) {
        geo.properties.REGION = `沙特阿拉伯.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
