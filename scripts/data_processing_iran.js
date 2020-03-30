const fs = require('fs')
const assert = require('assert')

const data_file = 'data/iran-data/iran.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_iran = {}
output_iran = {
    ENGLISH: 'Iran',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const data = fs.readFileSync(data_file, 'utf8').split(/\r?\n/)

let regions = []
let totalComfirmedCounts = {}

data.forEach((line, index) => {
    if (line === '') return
    const lineSplit = line.split(',')

    if (index === 0) {
        regions = lineSplit.slice(1)
        regions.forEach((regionEnglish) => {
            const region = en2zh[regionEnglish]
            assert(region != null, `${regionEnglish} does not exist!`)

            output_iran[region] = {
                ENGLISH: regionEnglish,
                confirmedCount: {},
                deadCount: {},
                curedCount: {}
            }
        })
    } else {
        const date = lineSplit[0].slice(0, 10)
        if (date === 'Total') {
            regions.forEach((regionEnglish, i) => {
                const region = en2zh[regionEnglish]
                totalComfirmedCounts[region] = parseInt(lineSplit[i + 1], 10)
            })
        } else {
            assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)
            regions.forEach((regionEnglish, i) => {
                const newConfirmedCount = parseInt(lineSplit[i + 1], 10)
                const region = en2zh[regionEnglish]
                output_iran[region]['confirmedCount'][date] = newConfirmedCount
            })
        }
    }
})

// fill missing data
regions.forEach((regionEnglish) => {
    const region = en2zh[regionEnglish]
    const missingCount =
        totalComfirmedCounts[region] -
        Object.keys(output_iran[region]['confirmedCount']).reduce(
            (s, x) => s + output_iran[region]['confirmedCount'][x],
            0
        )
    // uniformly distribute missing numbers into 2 days
    output_iran[region]['confirmedCount']['2020-03-02'] = Math.floor(missingCount / 2)
    output_iran[region]['confirmedCount']['2020-03-03'] = Math.ceil(missingCount / 2)
})

// calculate cumulative data
function parseDate(date) {
    const [ year, month, day ] = date.substr(0, 10).split('-')
    return new Date(year, month - 1, day)
}

regions.forEach((regionEnglish) => {
    const region = en2zh[regionEnglish]
    const dates = Object.keys(output_iran[region]['confirmedCount']).sort(
        (a, b) => (parseDate(a) > parseDate(b) ? 1 : -1)
    )
    dates.forEach((date, i) => {
        if (i > 0) output_iran[region]['confirmedCount'][date] += output_iran[region]['confirmedCount'][dates[i - 1]]
    })
})

fs.writeFileSync(`public/data/iran.json`, JSON.stringify(output_iran))

// modify map
const mapName = 'gadm36_IRN_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1

    if (regionEnglish === 'Ardebil') regionEnglish = 'Ardabil'
    if (regionEnglish === 'Chahar Mahall and Bakhtiari') regionEnglish = 'Chaharmahal and Bakhtiari'
    if (regionEnglish === 'East Azarbaijan') regionEnglish = 'East Azerbaijan'
    if (regionEnglish === 'West Azarbaijan') regionEnglish = 'West Azerbaijan'
    if (regionEnglish === 'Esfahan') regionEnglish = 'Isfahan'
    if (regionEnglish === 'Kohgiluyeh and Buyer Ahmad') regionEnglish = 'Kohgiluyeh and Boyer-Ahmad'

    const region = en2zh[regionEnglish]
    geo.properties.CHINESE_NAME = region
    assert(region != null, `${regionEnglish} does not exist!`)

    if (region in output_iran) {
        geo.properties.REGION = `伊朗.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
