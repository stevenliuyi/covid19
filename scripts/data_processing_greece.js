const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/greece-data/data/greece/isMOOD'
const data_file = 'cases_by_region_timeline.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

const NON_RESIDENT = 'Without permanent residency in Greece'
const UNASSIGNED = 'Under Investigation'

en2zh[NON_RESIDENT] = '非希腊居民'
en2zh[UNASSIGNED] = '未确定'

let output_greece = {
    ENGLISH: 'Greece',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const regions2 = {
    'East Macedonia and Thrace': 'Macedonia and Thrace',
    'Central Macedonia': 'Macedonia and Thrace',
    Epirus: 'Epirus and Western Macedonia',
    Thessaly: 'Thessaly and Central Greece',
    'Ionian Islands': 'Peloponnese, Western Greece and the Ionian Islands',
    'West Greece': 'Peloponnese, Western Greece and the Ionian Islands',
    'Central Greece': 'Thessaly and Central Greece',
    Attica: 'Attica',
    Peloponnese: 'Peloponnese, Western Greece and the Ionian Islands',
    'North Aegean': 'Aegean',
    'South Aegean': 'Aegean',
    Crete: 'Crete',
    'West Macedonia': 'Epirus and Western Macedonia',
    'Mount Athos': 'Mount Athos'
}

let regions = Object.values(regions2)
regions = [ ...new Set(regions) ]
;[ ...regions, NON_RESIDENT, UNASSIGNED ].forEach((regionEnglish) => {
    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)
    output_greece[region] = {
        ENGLISH: regionEnglish,
        confirmedCount: {},
        curedCount: {},
        deadCount: {}
    }
})

Object.keys(regions2).forEach((regionEnglish2) => {
    const region = en2zh[regions2[regionEnglish2]]
    const region2 = en2zh[regionEnglish2]
    assert(region != null && region2 != null, `${regionEnglish2} does not exist!`)
    output_greece[region][region2] = {
        ENGLISH: regionEnglish2,
        confirmedCount: {},
        curedCount: {},
        deadCount: {}
    }
})

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

let dates = []
data.forEach((line, index) => {
    if (line === '') return
    const lineSplit = line.split(',')

    if (index === 0) {
        lineSplit.slice(3).forEach((x) => {
            const date = `${x.slice(6, 10)}-${x.slice(3, 5)}-${x.slice(0, 2)}`
            dates.push(date)
        })
    } else {
        const regionEnglish2 = lineSplit[1].trim()
        const region2 = en2zh[regionEnglish2]
        const region = [ NON_RESIDENT, UNASSIGNED ].includes(regionEnglish2) ? region2 : en2zh[regions2[regionEnglish2]]
        assert(region != null && region2 != null, `${regionEnglish2} does not exist!`)

        lineSplit.slice(3).forEach((count, idx) => {
            const date = dates[idx]
            const confirmedCount = parseInt(count, 10)
            assert(!isNaN(confirmedCount), `${count} is not a valid count!`)
            if (!(date in output_greece[region]['confirmedCount'])) output_greece[region]['confirmedCount'][date] = 0

            if (![ NON_RESIDENT, UNASSIGNED ].includes(regionEnglish2))
                output_greece[region][region2]['confirmedCount'][date] = confirmedCount
            output_greece[region]['confirmedCount'][date] += confirmedCount
        })
    }
})

fs.writeFileSync(`public/data/greece.json`, JSON.stringify(output_greece))

// modify map
const mapName = 'gadm36_GRC_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    if (regionEnglish === 'Athos') regionEnglish = 'Mount Athos'

    const region = en2zh[regionEnglish]
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_greece) {
        geo.properties.REGION = `希腊.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
