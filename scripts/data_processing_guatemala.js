const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/guatemala-data'
const metric_folders = {
    confirmedCount: 'confirmed',
    deadCount: 'deaths'
}

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_guatemala = {}
output_guatemala = {
    ENGLISH: 'Guatemala',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

Object.keys(metric_folders).forEach((metric) => {
    const data_files = fs.readdirSync(`${data_folder}/${metric_folders[metric]}`)

    data_files.forEach((data_file) => {
        const data = fs.readFileSync(`${data_folder}/${metric_folders[metric]}/${data_file}`, 'utf8').split(/\r?\n/)
        data.forEach((line, index) => {
            if (line === '' || index === 0) return
            const lineSplit = line.split(',')

            const date = lineSplit[1].replace(/"/g, '')
            if (date === 'SIN DATOS' || date === 'Total') return
            assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

            let regionEnglish = lineSplit[0].replace(/"/g, '')
            regionEnglish = data_file.slice(0, -4).replace('_', ' ')
            const region = en2zh[regionEnglish]
            assert(region != null, `${regionEnglish} does not exist!`)

            if (!(region in output_guatemala)) {
                output_guatemala[region] = {
                    ENGLISH: regionEnglish,
                    confirmedCount: {},
                    curedCount: {},
                    deadCount: {}
                }
            }
            let count = metric === 'confirmedCount' ? lineSplit[4] : lineSplit[2]
            count = parseInt(count.replace(/"/g, ''), 10)
            output_guatemala[region][metric][date] = count
        })
    })
})

function parseDate(date) {
    const [ year, month, day ] = date.substr(0, 10).split('-')
    return new Date(year, month - 1, day)
}

// calculate cumulative counts
;[ 'confirmedCount', 'deadCount' ].forEach((metric) => {
    Object.keys(output_guatemala)
        .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH' ].includes(x))
        .forEach((region) => {
            const dates = Object.keys(output_guatemala[region][metric]).sort(
                (a, b) => (parseDate(a) > parseDate(b) ? 1 : -1)
            )
            const firstDate = dates[0]
            const lastDate = dates[dates.length - 1]

            let currentDate = firstDate
            let prevDate = null
            while (parseDate(currentDate) <= parseDate(lastDate)) {
                if (currentDate !== firstDate) {
                    if (!(currentDate in output_guatemala[region][metric])) {
                        output_guatemala[region][metric][currentDate] = output_guatemala[region][metric][prevDate]
                    } else {
                        output_guatemala[region][metric][currentDate] += output_guatemala[region][metric][prevDate]
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

fs.writeFileSync(`public/data/guatemala.json`, JSON.stringify(output_guatemala))

// modify map
const mapName = 'gadm36_GTM_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    regionEnglish = regionEnglish.replace('é', 'e')
    regionEnglish = regionEnglish.replace('á', 'a')
    if (regionEnglish === 'Quezaltenango') regionEnglish = 'Quetzaltenango'
    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_guatemala) {
        geo.properties.REGION = `危地马拉.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
