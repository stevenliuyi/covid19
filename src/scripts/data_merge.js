const fs = require('fs')
const _ = require('lodash')

const en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

const world_file = 'public/data/world.json'
let data = JSON.parse(fs.readFileSync(world_file))

// remove Chinese data in provincal level
data[en2zh['China']][en2zh['Mainland China']] = {
    ENGLISH: 'Mainland China',
    confirmedCount: data[en2zh['China']][en2zh['Mainland China']].confirmedCount,
    curedCount: data[en2zh['China']][en2zh['Mainland China']].curedCount,
    deadCount: data[en2zh['China']][en2zh['Mainland China']].deadCount
}

// combine detailed province/state level data from countries
const china_file = 'public/data/china.json'
let chinaData = JSON.parse(fs.readFileSync(china_file))

data[en2zh['China']][en2zh['Mainland China']] = {
    ...data[en2zh['China']][en2zh['Mainland China']],
    ...chinaData
}

const korea_file = 'public/data/korea.json'
let koreaData = JSON.parse(fs.readFileSync(korea_file))
data[en2zh['Republic of Korea']] = {
    ...koreaData,
    ...data[en2zh['Republic of Korea']]
}

const italy_file = 'public/data/italy.json'
let italyData = JSON.parse(fs.readFileSync(italy_file))
data[en2zh['Italy']] = {
    ...italyData,
    ...data[en2zh['Italy']]
}

const us_file = 'public/data/us.json'
let usData = JSON.parse(fs.readFileSync(us_file))
data[en2zh['United States of America']] = usData

const france_file = 'public/data/france.json'
let franceData = JSON.parse(fs.readFileSync(france_file))
let data_france = {
    ...franceData,
    confirmedCount: data[en2zh['France']].confirmedCount,
    curedCount: data[en2zh['France']].curedCount,
    deadCount: data[en2zh['France']].deadCount
}
data_france[en2zh['Metropolitan France']] = {
    ...data_france[en2zh['Metropolitan France']],
    confirmedCount: data[en2zh['France']][en2zh['Metropolitan France']].confirmedCount,
    curedCount: data[en2zh['France']][en2zh['Metropolitan France']].curedCount,
    deadCount: data[en2zh['France']][en2zh['Metropolitan France']].deadCount
}
;[ 'Martinique', 'Saint Barthelemy', 'St Martin' ].forEach((region) => {
    data_france[en2zh['Overseas France']][en2zh[region]] = data[en2zh['France']][en2zh[region]]
    ;[ 'confirmedCount', 'deadCount', 'curedCount' ].forEach((metric) => {
        data_france[en2zh['Overseas France']][metric] = _.mergeWith(
            {},
            data_france[en2zh['Overseas France']][metric],
            data[en2zh['France']][en2zh[region]][metric],
            _.add
        )
    })
})
data[en2zh['France']] = data_france

const germany_file = 'public/data/germany.json'
let germanyData = JSON.parse(fs.readFileSync(germany_file))
data[en2zh['Germany']] = {
    ...germanyData,
    ...data[en2zh['Germany']]
}

const japan_file = 'public/data/japan.json'
let japanData = JSON.parse(fs.readFileSync(japan_file))
data[en2zh['Japan']] = {
    ...japanData,
    ...data[en2zh['Japan']]
}

const austria_file = 'public/data/austria.json'
let austriaData = JSON.parse(fs.readFileSync(austria_file))
data[en2zh['Austria']] = {
    ...austriaData,
    ...data[en2zh['Austria']]
}

const merged_file_minified = 'public/data/all_minified.json'
const merged_file = 'public/data/all.json'
fs.writeFileSync(merged_file_minified, JSON.stringify(data))
fs.writeFileSync(merged_file, JSON.stringify(data, null, 2))
