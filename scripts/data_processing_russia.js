const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/russia-data/data'
const data_file = 'covid_stats.csv'

// translations
const russia_subjects = JSON.parse(fs.readFileSync('data/map-translations/russia_federal_subjects.json'))

let output_russia = {}
output_russia = {
    ENGLISH: 'Russia',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

let regions = []

data.forEach((line, index) => {
    if (line === '') return
    const lineSplit = line.split(',')

    if (index === 0) {
        lineSplit.slice(6).forEach((regionRussian) => {
            const regionCode = Object.keys(russia_subjects).find((x) => russia_subjects[x].ru === regionRussian)
            assert(regionCode != null, `${regionRussian} does not exist!`)
            const regionEnglish = russia_subjects[regionCode].en
            const region = russia_subjects[regionCode].zh
            assert(region != null || regionEnglish != null, `${regionEnglish} does not exist!`)

            regions.push(regionCode)

            output_russia[region] = {
                ENGLISH: regionEnglish,
                confirmedCount: {},
                curedCount: {},
                deadCount: {}
            }
        })

        return
    }

    let date = lineSplit[0]
    date = `${date.slice(6, 10)}-${date.slice(3, 5)}-${date.slice(0, 2)}`
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    const metric = lineSplit[1]

    lineSplit.slice(6).forEach((x, idx) => {
        let count = parseInt(x, 10)
        if (x === '') count = 0
        assert(!isNaN(count), `${x} is not a valid count!`)

        const regionEnglish = russia_subjects[regions[idx]].en
        const region = russia_subjects[regions[idx]].zh
        assert(region != null || regionEnglish != null, `${regionEnglish} does not exist!`)

        if (metric === 'total') {
            output_russia[region]['confirmedCount'][date] = count
        } else if (metric === 'recovered') {
            output_russia[region]['curedCount'][date] = count
        } else if (metric === 'died') {
            output_russia[region]['deadCount'][date] = count
        }
    })
})

fs.writeFileSync(`public/data/russia.json`, JSON.stringify(output_russia))
//
// modify map
const mapName = 'gadm36_RUS_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionCode = geo.properties.HASC_1
    if (geo.properties.NAME_1 === 'Moscow City') regionCode = 'RU.MC'
    const region = russia_subjects[regionCode].zh
    const regionEnglish = russia_subjects[regionCode].en
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_russia) {
        geo.properties.REGION = `俄罗斯.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
