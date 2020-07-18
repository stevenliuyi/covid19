const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/nepal-data'
const data_file = 'raw.json'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_nepal = {
    ENGLISH: 'Nepal',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const provinces = [ 'Province 1', 'Province 2', 'Bagmati', 'Gandaki', 'Province 5', 'Karnali', 'Sudurpashchim' ]

const data = JSON.parse(fs.readFileSync(`${data_folder}/${data_file}`))

data.forEach((record) => {
    const confirmedDate = record['reportedOn']
    assert(!isNaN(new Date(confirmedDate)), `Date ${confirmedDate} is not valid!`)

    const curedDate = record['recoveredOn']
    assert(!isNaN(new Date(curedDate)) || curedDate == null, `Date ${curedDate} is not valid!`)

    const deadDate = record['deathOn']
    assert(!isNaN(new Date(deadDate)) || deadDate == null, `Date ${deadDate} is not valid!`)

    const regionEnglish = provinces[record['province'] - 1]
    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    if (!(region in output_nepal)) {
        output_nepal[region] = {
            ENGLISH: regionEnglish,
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }
    }

    if (!(confirmedDate in output_nepal[region]['confirmedCount']))
        output_nepal[region]['confirmedCount'][confirmedDate] = 0
    output_nepal[region]['confirmedCount'][confirmedDate] += 1 // daily count

    //if (curedDate != null) {
    //    if (!(curedDate in output_nepal[region]['curedCount'])) output_nepal[region]['curedCount'][curedDate] = 0
    //    output_nepal[region]['curedCount'][curedDate] += 1 // daily count
    //}
    if (deadDate != null) {
        if (!(deadDate in output_nepal[region]['deadCount'])) output_nepal[region]['deadCount'][deadDate] = 0
        output_nepal[region]['deadCount'][deadDate] += 1 // daily count
    }
})

// first death date
const firstDates = {
    0: '2020-04-17',
    1: '2020-04-12',
    2: '2020-01-24',
    3: '2020-03-28',
    4: '2020-05-01',
    5: '2020-05-18',
    6: '2020-03-27'
}
;[ ...Array(7).keys() ].forEach((provinceId) => {
    output_nepal[en2zh[provinces[provinceId]]]['deadCount'][firstDates[provinceId]] = 0
})

function parseDate(date) {
    const [ year, month, day ] = date.substr(0, 10).split('-')
    return new Date(year, month - 1, day)
}

// calculate cumulative counts
;[ 'confirmedCount', 'deadCount' ].forEach((metric) => {
    Object.keys(output_nepal)
        .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH' ].includes(x))
        .forEach((region) => {
            const dates = Object.keys(output_nepal[region][metric]).sort(
                (a, b) => (parseDate(a) > parseDate(b) ? 1 : -1)
            )
            const firstDate = dates[0]
            const lastDate = dates[dates.length - 1]

            let currentDate = firstDate
            let prevDate = null
            while (parseDate(currentDate) <= parseDate(lastDate)) {
                if (currentDate !== firstDate) {
                    if (!(currentDate in output_nepal[region][metric])) {
                        output_nepal[region][metric][currentDate] = output_nepal[region][metric][prevDate]
                    } else {
                        output_nepal[region][metric][currentDate] += output_nepal[region][metric][prevDate]
                    }
                }

                // next day
                prevDate = currentDate
                currentDate = parseDate(currentDate)
                currentDate.setDate(currentDate.getDate() + 1)
                currentDate = currentDate.toISOString().slice(0, 10)
            }
        })
})

fs.writeFileSync(`public/data/nepal.json`, JSON.stringify(output_nepal))

// modify map
const mapName = 'NPL'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
const objName = 'nepal'
let geometries = map.objects[objName].geometries

geometries.forEach((geo) => {
    const provinceId = parseInt(geo.properties.ADM1_EN, 10)
    const regionEnglish = provinces[provinceId - 1]
    const region = en2zh[regionEnglish]
    assert(region != null, `${geo.properties.ADM1_EN} does not exist!`)

    geo.properties.ENGLISH_NAME = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_nepal) {
        geo.properties.REGION = `尼泊尔.${region}`
    }
})

map.objects[objName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
