const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/romania-data'
const data_file = 'raw.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_romania = {
    ENGLISH: 'Romania',
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

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

data.forEach((line, index) => {
    if (line === '' || index === 0) return
    const lineSplit = splitCSV(line)
    const regionEnglish = lineSplit[2]
    if (regionEnglish === '' || regionEnglish === 'Necunoscut') return

    const dates = {
        confirmedCount: lineSplit[3],
        curedCount: lineSplit[6],
        deadCount: lineSplit[7]
    }

    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    if (!(region in output_romania)) {
        output_romania[region] = {
            ENGLISH: regionEnglish,
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }
    }

    Object.keys(dates).forEach((metric) => {
        const date = dates[metric]
        if (date !== '') {
            assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)
            if (!(date in output_romania[region][metric])) output_romania[region][metric][date] = 0
            output_romania[region][metric][date] += 1
        }
    })
})

function parseDate(date) {
    const [ year, month, day ] = date.substr(0, 10).split('-')
    return new Date(year, month - 1, day)
}

Object.keys(output_romania)
    .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH' ].includes(x))
    .forEach((region) => {
        ;[ 'confirmedCount', 'curedCount', 'deadCount' ].forEach((metric) => {
            const dates = Object.keys(output_romania[region][metric]).sort(
                (a, b) => (parseDate(a) > parseDate(b) ? 1 : -1)
            )
            if (dates.length === 0) return

            const firstDate = dates[0]
            const lastDate = dates[dates.length - 1]

            let currentDate = firstDate
            let prevDate = null
            while (parseDate(currentDate) <= parseDate(lastDate)) {
                if (currentDate !== firstDate) {
                    if (!(currentDate in output_romania[region][metric])) {
                        output_romania[region][metric][currentDate] = output_romania[region][metric][prevDate]
                    } else {
                        output_romania[region][metric][currentDate] += output_romania[region][metric][prevDate]
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

fs.writeFileSync(`public/data/romania.json`, JSON.stringify(output_romania))

// modify map
const mapName = 'gadm36_ROU_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    if (regionEnglish === 'Bucharest') regionEnglish = 'București'

    const region = en2zh[regionEnglish]
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_romania) {
        geo.properties.REGION = `罗马尼亚.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
