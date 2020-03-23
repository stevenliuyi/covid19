const fs = require('fs')
const _ = require('lodash')
const assert = require('assert')

const data_folder = 'data/france-data'
const data_files = {
    confirmedCount: 'france_coronavirus_time_series-confirmed.csv',
    deadCount: 'france_coronavirus_time_series-deaths.csv',
    curedCount: 'france_coronavirus_time_series-recovered.csv'
}

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_france = {
    ENGLISH: 'France',
    法国本土: {
        ENGLISH: 'Metropolitan France',
        confirmedCount: {},
        deadCount: {},
        curedCount: {}
    },
    海外领土: {
        ENGLISH: 'Overseas France',
        confirmedCount: {},
        deadCount: {},
        curedCount: {}
    }
}
;[ 'confirmedCount', 'deadCount', 'curedCount' ].forEach((metric) => {
    const data = fs.readFileSync(`${data_folder}/${data_files[metric]}`, 'utf8').split(/\r?\n/)
    let regions = []
    let currentDate = ''

    data.forEach((line, index) => {
        const lineSplit = line.split(',')
        if (lineSplit.length === 1) return

        // header
        if (index === 0) {
            regions = lineSplit.slice(1, lineSplit.length - 1)
            regions.forEach((regionEnglish, i) => {
                const france = i <= 12 ? '法国本土' : '海外领土'
                const region = en2zh[regionEnglish]
                if (output_france[france][region] == null)
                    output_france[france][region] = {
                        ENGLISH: regionEnglish,
                        confirmedCount: {},
                        deadCount: {},
                        curedCount: {}
                    }
            })
        } else {
            // data
            const rawDate = lineSplit[0]
            const date = `${rawDate.slice(6, 10)}-${rawDate.slice(3, 5)}-${rawDate.slice(0, 2)}`
            assert(!isNaN(new Date(date)), `Date ${rawDate} is not valid!`)
            const regionsCounts = lineSplit.slice(1, lineSplit.length - 1).map((x) => parseInt(x, 10))
            regionsCounts.forEach((count, i) => {
                const france = i <= 12 ? '法国本土' : '海外领土'
                // use data from previous date if data not exist
                output_france[france][en2zh[regions[i]]][metric][date] = isNaN(count)
                    ? output_france[france][en2zh[regions[i]]][metric][currentDate]
                    : count
            })
            currentDate = date
        }
    })
})

// cumulative counts
;[ '法国本土', '海外领土' ].forEach((france) => {
    Object.keys(output_france[france]).forEach((region) => {
        output_france[france]['confirmedCount'] = _.mergeWith(
            {},
            output_france[france]['confirmedCount'],
            output_france[france][region]['confirmedCount'],
            _.add
        )
        output_france[france]['deadCount'] = _.mergeWith(
            {},
            output_france[france]['deadCount'],
            output_france[france][region]['deadCount'],
            _.add
        )
        output_france[france]['curedCount'] = _.mergeWith(
            {},
            output_france[france]['curedCount'],
            output_france[france][region]['curedCount'],
            _.add
        )
    })
})
fs.writeFileSync(`public/data/france.json`, JSON.stringify(output_france))

// modify map
const mapName = 'gadm36_FRA_1'
let map = JSON.parse(fs.readFileSync(`public/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    const regionEnglish = geo.properties.NAME_1
    const region = en2zh[regionEnglish]

    geo.properties.CHINESE_NAME = region
    geo.properties.REGION = `法国.法国本土.${region}`
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
