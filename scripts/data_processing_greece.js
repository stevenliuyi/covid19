const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/greece-data/COVID-19'
const data_files = {
    confirmedCount: 'regions_greece_cases.csv',
    deadCount: 'regions_greece_deaths.csv'
}

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

const NON_RESIDENT = 'Non-Residents'
const UNASSIGNED = 'No Location Provided'

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
    'Western Greece': 'Peloponnese, Western Greece and the Ionian Islands',
    'Central Greece': 'Thessaly and Central Greece',
    Attica: 'Attica',
    Peloponnese: 'Peloponnese, Western Greece and the Ionian Islands',
    'North Aegean': 'Aegean',
    'South Aegean': 'Aegean',
    Crete: 'Crete',
    'Western Macedonia': 'Epirus and Western Macedonia',
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

Object.keys(data_files).forEach((metric) => {
    const data = fs.readFileSync(`${data_folder}/${data_files[metric]}`, 'utf8').split(/\r?\n/)

    let dates = []
    data.forEach((line, index) => {
        if (line === '' || index >= 17) return
        const lineSplit = line.split(',')

        if (index === 0) {
            lineSplit.slice(3).forEach((x) => {
                let date = x.split('/').map((t) => t.padStart(2, '0'))
                date = `20${date[2]}-${date[0]}-${date[1]}`
                dates.push(date)
            })
        } else {
            let regionEnglish2 = lineSplit[1].replace('East Macedonia-Thrace', 'East Macedonia and Thrace').trim()
            if (regionEnglish2 === 'Non Greek Residents') regionEnglish2 = NON_RESIDENT
            const region2 = en2zh[regionEnglish2]
            const region = [ NON_RESIDENT, UNASSIGNED ].includes(regionEnglish2)
                ? region2
                : en2zh[regions2[regionEnglish2]]
            assert(region != null && region2 != null, `${regionEnglish2} does not exist!`)

            let prevDate = ''
            lineSplit.slice(3).forEach((count, idx) => {
                const date = dates[idx]
                if (date === prevDate) return // ignore duplicate records

                const metricCount = parseInt(count, 10)
                if (isNaN(metricCount)) return

                if (!(date in output_greece[region][metric])) output_greece[region][metric][date] = 0

                if (![ NON_RESIDENT, UNASSIGNED ].includes(regionEnglish2))
                    output_greece[region][region2][metric][date] = metricCount
                output_greece[region][metric][date] += metricCount

                prevDate = date
            })
        }
    })
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
