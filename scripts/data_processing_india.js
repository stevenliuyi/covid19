const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/india-data'
const data_file = 'raw.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_india = {
    ENGLISH: 'India',
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
    const date = lineSplit[2].split('/').reverse().join('-')
    if (date === '') return
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    const regionEnglish = lineSplit[8]
    if (regionEnglish === '') return
    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    if (!(region in output_india)) {
        output_india[region] = {
            ENGLISH: regionEnglish,
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }
    }

    if (!(date in output_india[region]['confirmedCount'])) output_india[region]['confirmedCount'][date] = 0
    output_india[region]['confirmedCount'][date] += 1 // daily count
})

function parseDate(date) {
    const [ year, month, day ] = date.substr(0, 10).split('-')
    return new Date(year, month - 1, day)
}

// calculate cumulative counts
Object.keys(output_india)
    .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH' ].includes(x))
    .forEach((region) => {
        const dates = Object.keys(output_india[region]['confirmedCount'])
        const firstDate = dates[0]
        const lastDate = dates[dates.length - 1]

        let currentDate = firstDate
        let prevDate = null
        while (parseDate(currentDate) <= parseDate(lastDate)) {
            if (currentDate !== firstDate) {
                if (!(currentDate in output_india[region]['confirmedCount'])) {
                    output_india[region]['confirmedCount'][currentDate] =
                        output_india[region]['confirmedCount'][prevDate]
                } else {
                    output_india[region]['confirmedCount'][currentDate] +=
                        output_india[region]['confirmedCount'][prevDate]
                }
            }

            // next day
            prevDate = currentDate
            currentDate = parseDate(currentDate)
            currentDate.setDate(currentDate.getDate() + 1)
            currentDate = currentDate.toISOString().slice(0, 10)
        }
    })

fs.writeFileSync(`public/data/india.json`, JSON.stringify(output_india))

// modify map
let map = JSON.parse(fs.readFileSync('data/maps/india.json'))
const objName = 'india'
let geometries = map.objects[objName].geometries

geometries.forEach((geo) => {
    const regionEnglish = geo.properties.st_nm
    if (regionEnglish === 'Hello') return

    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    geo.properties.CHINESE_NAME = region
    if (region in output_india) {
        geo.properties.REGION = `印度.${region}`
    }
})
map.objects[objName].geometries = geometries
fs.writeFileSync('public/maps/IND.json', JSON.stringify(map))
