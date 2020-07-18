const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/bangladesh-data'
const data_file = 'time_series.json'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_bangladesh = {
    ENGLISH: 'Bangladesh',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const data = JSON.parse(fs.readFileSync(`${data_folder}/${data_file}`))

const region_name_changes = {
    Barishal: 'Barisal',
    Chattogram: 'Chittagong'
}
const city_name_changes = {
    Bogra: 'Bogura',
    'Cox’s bazar': 'Cox’s Bazar',
    Narsingdi: 'Narshingdi',
    Habiganj: 'Hobiganj',
    Panchagarh: 'Panchagar',
    Patuakhali: 'Potuakhali',
    Munshiganj: 'Munshigonj',
    'B. Baria': 'Brahmanbaria',
    Rangmati: 'Rangamati'
}

data.forEach((feature) => {
    const cityEnglish = feature['attributes']['city']
    if (cityEnglish in city_name_changes) feature['attributes']['city'] = city_name_changes[cityEnglish]
})

// check if there are different names for one division
let cities = {}
data.forEach((feature) => {
    const code = feature['attributes']['geo_code']
    if (!(code in cities)) cities[code] = feature['attributes']['city']

    // Dhaka City and Dhaka Subrub share the same code
    if (code === 3026) return

    // wrong code
    if (code === 5010 && feature['attributes']['city'] === 'Brahmanbaria') return
    assert(
        cities[code] === feature['attributes']['city'],
        `${cities[code]} and ${feature['attributes']['city']} do not match (code = ${code})!`
    )
})

data.forEach((feature) => {
    let date = new Date(feature['attributes']['date'])
    assert(!isNaN(date), `Date ${feature['attributes']['date']} is not valid!`)
    date = date.toISOString().slice(0, 10)

    let regionEnglish = feature['attributes']['division']
    if (regionEnglish in region_name_changes) regionEnglish = region_name_changes[regionEnglish]

    let districtEnglish = feature['attributes']['district']
    if (districtEnglish in city_name_changes) districtEnglish = city_name_changes[districtEnglish]

    const cityEnglish = feature['attributes']['city']

    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    const confirmedCount = feature['attributes']['cases']

    if (!(region in output_bangladesh)) {
        output_bangladesh[region] = {
            ENGLISH: regionEnglish,
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }
    }

    if (!(districtEnglish in output_bangladesh[region])) {
        output_bangladesh[region][districtEnglish] = {
            ENGLISH: districtEnglish,
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }
    }
    if (!(cityEnglish in output_bangladesh[region][districtEnglish])) {
        output_bangladesh[region][districtEnglish][cityEnglish] = {
            ENGLISH: cityEnglish,
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }
    }

    output_bangladesh[region][districtEnglish][cityEnglish]['confirmedCount'][date] = confirmedCount
})

function parseDate(date) {
    const [ year, month, day ] = date.substr(0, 10).split('-')
    return new Date(year, month - 1, day)
}

// fill missing data and sort by date
// copied from missing_data_fix.js
let currDate = new Date()
currDate.setHours(currDate.getHours() - 7)
currDate = currDate.toISOString().slice(0, 10)
currDate = parseDate(currDate)

function fillMissingData(obj, ignore_leading_zeros = true) {
    if (typeof obj !== 'object' || obj == null) return
    ;[ 'confirmedCount', 'curedCount', 'deadCount' ].forEach((metric) => {
        if (obj[metric] == null) obj[metric] = {}
        if (Object.keys(obj[metric]).length === 0) return

        const firstDateString = Object.keys(obj[metric]).sort((a, b) => (parseDate(a) > parseDate(b) ? 1 : -1))[0]
        let date = parseDate(firstDateString)
        let previousDate = new Date(date.getTime())

        // use a new object so that the date keys are sorted
        let newMetricObj = {}

        let firstCaseOccurs = false
        while (date <= currDate) {
            const dateString = date.toISOString().slice(0, 10)
            const previousDateString = previousDate.toISOString().slice(0, 10)

            const count = obj[metric][dateString]

            if (isNaN(count) || count == null) {
                delete obj[metric][dateString]
                // return
            }

            // assert(!isNaN(count) && count != null, `${count} is not a valid count (${obj.ENGLISH})!`)

            if (!(dateString in obj[metric])) {
                obj[metric][dateString] = obj[metric][previousDateString]
            }

            if (count > 0) firstCaseOccurs = true
            if (firstCaseOccurs || !ignore_leading_zeros) newMetricObj[dateString] = obj[metric][dateString]

            // next day
            previousDate = new Date(date.getTime())
            date.setDate(date.getDate() + 1)
        }

        obj[metric] = newMetricObj
    })

    Object.keys(obj)
        .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH' ].includes(x))
        .forEach((x) => {
            fillMissingData(obj[x], ignore_leading_zeros)
        })
}

fillMissingData(output_bangladesh, false)

Object.keys(output_bangladesh)
    .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH' ].includes(x))
    .forEach((region) => {
        Object.keys(output_bangladesh[region])
            .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH' ].includes(x))
            .forEach((district) => {
                Object.keys(output_bangladesh[region][district])
                    .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH' ].includes(x))
                    .forEach((city) => {
                        Object.keys(output_bangladesh[region][district][city]['confirmedCount']).forEach((date) => {
                            const confirmedCount = output_bangladesh[region][district][city]['confirmedCount'][date]

                            if (!(date in output_bangladesh[region]['confirmedCount']))
                                output_bangladesh[region]['confirmedCount'][date] = 0
                            if (!(date in output_bangladesh[region][district]['confirmedCount']))
                                output_bangladesh[region][district]['confirmedCount'][date] = 0

                            output_bangladesh[region]['confirmedCount'][date] += confirmedCount
                            output_bangladesh[region][district]['confirmedCount'][date] += confirmedCount
                        })
                    })
            })
    })

// only keep admin1 data for now
Object.keys(output_bangladesh)
    .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH' ].includes(x))
    .forEach((region) => {
        output_bangladesh[region] = {
            ENGLISH: output_bangladesh[region]['ENGLISH'],
            confirmedCount: output_bangladesh[region]['confirmedCount'],
            deadCount: output_bangladesh[region]['deadCount'],
            curedCount: output_bangladesh[region]['curedCount']
        }
    })

fs.writeFileSync(`public/data/bangladesh.json`, JSON.stringify(output_bangladesh))

// modify map
const mapName = 'BGD'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
const objectName = 'bgd_admbnda_adm1_bbs_20180410'
let geometries = map.objects[objectName].geometries

geometries.forEach((geo) => {
    const regionEnglish = geo.properties.ADM1_EN
    const region = en2zh[regionEnglish]
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)

    geo.properties.CHINESE_NAME = region

    if (region in output_bangladesh) {
        geo.properties.REGION = `孟加拉国.${region}`
    }
})

map.objects[objectName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
