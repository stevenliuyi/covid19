const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/cds-data'
const data_file = 'timeseries-byLocation.json'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

const name_changes = {
    Sejong: 'Sejong City'
}

const countries = {
    KR: 'South Korea'
}

let output = {}
Object.values(countries).forEach((countryEnglish) => {
    const country = en2zh[countryEnglish]
    assert(country != null, `${countryEnglish} does not exist!`)
    output[country] = {
        ENGLISH: countryEnglish,
        confirmedCount: {},
        deadCount: {},
        curedCount: {}
    }
})

const data = JSON.parse(fs.readFileSync(`${data_folder}/${data_file}`))
Object.values(data).forEach((record, index) => {
    if (!('stateId' in record)) return

    const countryISO = Object.keys(countries).find((x) => record['stateId'].includes(`iso2:${x}`))
    if (countryISO == null) return

    const countryEnglish = countries[countryISO]
    const country = en2zh[countryEnglish]

    let regionEnglish = record['state']
    if (regionEnglish in name_changes) regionEnglish = name_changes[regionEnglish]
    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    if (!(region in output[country])) {
        output[country][region] = {
            ENGLISH: regionEnglish,
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }
    }

    Object.keys(record['dates']).forEach((date) => {
        assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

        const confirmedCount = parseInt(record['dates'][date]['cases'], 10)
        const curedCount = parseInt(record['dates'][date]['recovered'], 10)
        const deadCount = parseInt(record['dates'][date]['deaths'], 10)

        if (!isNaN(confirmedCount)) output[country][region]['confirmedCount'][date] = confirmedCount
        if (!isNaN(curedCount)) output[country][region]['curedCount'][date] = curedCount
        if (!isNaN(deadCount)) output[country][region]['deadCount'][date] = deadCount
    })
})

//fs.writeFileSync(`public/data/output.json`, JSON.stringify(output))
