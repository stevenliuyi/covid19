const fs = require('fs')
const assert = require('assert')

function parseDate(date) {
    const [ year, month, day ] = date.substr(0, 10).split('-')
    return new Date(year, month - 1, day)
}

const data_folder = 'data/slovenia-data'
const regions_file = 'regions.json'
let data_files = fs.readdirSync(data_folder)

data_files = data_files.filter((filename) => filename.endsWith('.csv'))
data_files.sort()

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))
const IMPORTED = 'Imported'
en2zh[IMPORTED] = '境外输入'

const city_name_changes = {
    'Sveta Trojica v Slov. goricah': 'Sveta Trojica v Slovenskih goricah'
}

const sloveniaRegions = JSON.parse(fs.readFileSync(`${data_folder}/${regions_file}`))

let output_slovenia = {}
output_slovenia = {
    ENGLISH: 'Slovenia',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}
;[ ...Object.keys(sloveniaRegions), IMPORTED ].forEach((regionEnglish) => {
    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    output_slovenia[region] = {
        ENGLISH: regionEnglish,
        confirmedCount: {},
        curedCount: {},
        deadCount: {}
    }

    if (regionEnglish === IMPORTED) return
    sloveniaRegions[regionEnglish].forEach((cityEnglish) => {
        output_slovenia[region][cityEnglish] = {
            ENGLISH: cityEnglish,
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }
    })
})

data_files.forEach((data_file) => {
    let date = data_file.slice(0, 10)
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)
    let totalConfirmedCount = 0
    let totalConfirmedCount_original = 0
    data.forEach((line, index) => {
        if (line === '') return
        const lineSplit = line.split(',')

        // total counts
        if (index === 0) {
            totalConfirmedCount_original = parseInt(lineSplit[3], 10)
            return
        }

        const confirmedCount = parseInt(lineSplit[3], 10)
        assert(!isNaN(confirmedCount), `${lineSplit[3]} is not a valid count!`)
        totalConfirmedCount += confirmedCount

        let cityEnglish = lineSplit[0].replace(/\s+/g, ' ')
        if (cityEnglish.includes('/')) cityEnglish = cityEnglish.split('/')[0]
        if (cityEnglish in city_name_changes) cityEnglish = city_name_changes[cityEnglish]

        // imported cases
        if (cityEnglish === 'TUJINA') {
            output_slovenia[en2zh[IMPORTED]]['confirmedCount'][date] = confirmedCount
            return
        }

        const regionEnglish = Object.keys(sloveniaRegions).find((x) => sloveniaRegions[x].includes(cityEnglish))
        assert(regionEnglish != null, `Cannot find municipality ${lineSplit[0]}`)

        const region = en2zh[regionEnglish]
        assert(region != null, `${regionEnglish} does not exist!`)

        if (!(date in output_slovenia[region]['confirmedCount'])) output_slovenia[region]['confirmedCount'][date] = 0

        output_slovenia[region][cityEnglish]['confirmedCount'][date] = confirmedCount
        output_slovenia[region]['confirmedCount'][date] += confirmedCount
    })

    if (totalConfirmedCount !== totalConfirmedCount_original)
        console.log(
            `${date}: Tota number of reported cases is ${totalConfirmedCount_original}, but the sum of cases of all municipalities is ${totalConfirmedCount}!`
        )
})

fs.writeFileSync(`public/data/slovenia.json`, JSON.stringify(output_slovenia))

// modify map
const mapName = 'gadm36_SVN_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

const name_changes = {
    Gorenjska: 'Upper Carniola',
    Goriška: 'Gorizia',
    'Jugovzhodna Slovenija': 'Southeast Slovenia',
    Koroška: 'Carinthia',
    'Notranjsko-kraška': 'Littoral-Inner Carniola',
    'Obalno-kraška': 'Coastal-Karst',
    Osrednjeslovenska: 'Central Slovenia',
    Podravska: 'Drava',
    Pomurska: 'Mura',
    Savinjska: 'Savinja',
    Spodnjeposavska: 'Lower Sava',
    Zasavska: 'Central Sava'
}

geometries.forEach((geo) => {
    const regionEnglish = name_changes[geo.properties.NAME_1]
    const region = en2zh[regionEnglish]
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_slovenia) {
        geo.properties.REGION = `斯洛文尼亚.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
