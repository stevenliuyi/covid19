const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/philippines-data'
const data_file = 'cases.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))
en2zh[''] = ''

let output_philippines = {
    ENGLISH: 'Philippines',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const splitCSV = function(string) {
    var matches = string.match(/(\s*"[^"]+"\s*|\s*[^,]+|,)(?=,|$)/g)
    if (matches == null) return null
    for (var n = 0; n < matches.length; ++n) {
        matches[n] = matches[n].trim()
        if (matches[n] === ',') matches[n] = ''
    }
    if (string[0] === ',') matches.unshift('')
    return matches
}

const capitalizeFirstLetter = function(string) {
    let splitted = string.split(' ')
    splitted = splitted.map((str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase())
    return splitted.join(' ')
}

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

data.forEach((line, index) => {
    if (line === '' || index === 0) return
    const lineSplit = splitCSV(line)
    let date = lineSplit[6]
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    if (date.toLowerCase().includes('validation') || date === '') return
    date = date.slice(0, 10)

    let regionEnglish = capitalizeFirstLetter(lineSplit[12])

    let provinceEnglish = capitalizeFirstLetter(lineSplit[13]).replace(' Province', '').replace(' Del ', ' del ')
    if (provinceEnglish === 'Compostela Valley') provinceEnglish = 'Davao de Oro'

    if (regionEnglish === '') return

    const region = regionEnglish
    const province = en2zh[provinceEnglish]
    assert(province != null, `${lineSplit[13]} does not exist!`)

    if (!(region in output_philippines)) {
        output_philippines[region] = {
            ENGLISH: regionEnglish,
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }
    }

    if (province !== '' && !(province in output_philippines[region])) {
        output_philippines[region][province] = {
            ENGLISH: provinceEnglish,
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }
    }

    if (!(date in output_philippines[region]['confirmedCount'])) output_philippines[region]['confirmedCount'][date] = 0
    output_philippines[region]['confirmedCount'][date] += 1

    if (province !== '') {
        if (!(date in output_philippines[region][province]['confirmedCount']))
            output_philippines[region][province]['confirmedCount'][date] = 0
        output_philippines[region][province]['confirmedCount'][date] += 1
    }
})

function parseDate(date) {
    const [ year, month, day ] = date.substr(0, 10).split('-')
    return new Date(year, month - 1, day)
}

// calculate cumulative counts
function calcCumulativeCount(obj) {
    Object.keys(obj)
        .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH' ].includes(x))
        .forEach((region) => {
            const dates = Object.keys(obj[region]['confirmedCount']).sort(
                (a, b) => (parseDate(a) > parseDate(b) ? 1 : -1)
            )
            const firstDate = dates[0]
            const lastDate = dates[dates.length - 1]

            let currentDate = firstDate
            let prevDate = null
            while (parseDate(currentDate) <= parseDate(lastDate)) {
                if (currentDate !== firstDate) {
                    if (!(currentDate in obj[region]['confirmedCount'])) {
                        obj[region]['confirmedCount'][currentDate] = obj[region]['confirmedCount'][prevDate]
                    } else {
                        obj[region]['confirmedCount'][currentDate] += obj[region]['confirmedCount'][prevDate]
                    }
                }

                // next day
                prevDate = currentDate
                currentDate = parseDate(currentDate)
                currentDate.setDate(currentDate.getDate() + 1)
                currentDate = currentDate.toISOString().slice(0, 10)
            }
        })

    return obj
}

output_philippines = calcCumulativeCount(output_philippines)
Object.keys(output_philippines)
    .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH' ].includes(x))
    .forEach((region) => {
        output_philippines[region] = calcCumulativeCount(output_philippines[region])
    })

//fs.writeFileSync(`public/data/philippines.json`, JSON.stringify(output_philippines))
//
//// modify map
//const mapName = 'gadm36_PHL_1'
//let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
//let geometries = map.objects[mapName].geometries
//
//geometries.forEach((geo) => {
//    let regionEnglish = geo.properties.NAME_1
//    if (regionEnglish === 'Metropolitan Manila') regionEnglish = 'Metro Manila'
//    if (regionEnglish === 'Compostela Valley') regionEnglish = 'Davao de Oro'
//    if (regionEnglish === 'North Cotabato') regionEnglish = 'Cotabato'
//
//    const region = en2zh[regionEnglish]
//    assert(region != null, `${geo.properties.NAME_1} does not exist!`)
//
//    geo.properties.NAME_1 = regionEnglish
//    geo.properties.CHINESE_NAME = region
//
//    if (region in output_philippines) {
//        geo.properties.REGION = `菲律宾.${region}`
//    }
//})
//
//map.objects[mapName].geometries = geometries
//fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
//
