const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/nigeria-data/data/csv'
const data_files = {
    confirmedCount: 'ncdc-covid19-states-daily-cases.csv',
    curedCount: 'ncdc-covid19-states-daily-recovered.csv',
    deadCount: 'ncdc-covid19-states-daily-deaths.csv'
}

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))
en2zh['Niger'] = '尼日尔州'

let output_nigeria = {}

output_nigeria = {
    ENGLISH: 'Nigeria',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

let regions = []

Object.keys(data_files).forEach((metric) => {
    const data_file = data_files[metric]
    const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

    data.forEach((line, index) => {
        if (line === '') return
        const lineSplit = line.split(',')

        if (index === 0) {
            if (metric !== 'confirmedCount') return
            regions = lineSplit.slice(1)
            regions.forEach((currRegion) => {
                let regionEnglish = currRegion
                if (regionEnglish === 'FCT') regionEnglish = 'Federal Captial Territory'
                const region = en2zh[regionEnglish]
                assert(region != null, `${regionEnglish} does not exist!`)
                output_nigeria[region] = {
                    ENGLISH: regionEnglish,
                    confirmedCount: {},
                    curedCount: {},
                    deadCount: {}
                }
            })
        } else {
            const date = lineSplit[0].trim()
            assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

            regions.forEach((currRegion, i) => {
                let regionEnglish = currRegion
                if (regionEnglish === 'FCT') regionEnglish = 'Federal Captial Territory'
                const region = en2zh[regionEnglish]
                const count = parseInt(lineSplit[i + 1], 10)
                if (!isNaN(count)) {
                    output_nigeria[region][metric][date] = count
                }
            })
        }
    })
})

fs.writeFileSync(`public/data/nigeria.json`, JSON.stringify(output_nigeria))

// modify map
// const mapName = 'gadm36_NGA_1'
// let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
// let geometries = map.objects[mapName].geometries
//
// geometries.forEach((geo) => {
//     let regionEnglish = geo.properties.NAME_1
//     const region = en2zh[regionEnglish]
//     assert(region != null, `${regionEnglish} does not exist!`)
//
//     geo.properties.NAME_1 = regionEnglish
//     geo.properties.CHINESE_NAME = region
//
//     if (region in output_nigeria) {
//         geo.properties.REGION = `尼日利亚.${region}`
//     }
// })
//
// map.objects[mapName].geometries = geometries
// fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
//
