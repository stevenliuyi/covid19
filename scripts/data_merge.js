const fs = require('fs')
const _ = require('lodash')

const en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

const world_file = 'public/data/world.json'
let data = JSON.parse(fs.readFileSync(world_file))

// combine detailed province/state level data from countries
const china_file = 'public/data/china.json'
let chinaData = JSON.parse(fs.readFileSync(china_file))
data[en2zh['China']] = chinaData

const korea_file = 'public/data/korea.json'
let koreaData = JSON.parse(fs.readFileSync(korea_file))
data[en2zh['South Korea']] = {
    ...koreaData,
    ...data[en2zh['South Korea']]
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
;[ 'French Polynesia' ].forEach((region) => {
    data_france[en2zh['Overseas France']][en2zh[region]] = data[en2zh['France']][en2zh[region]]
    ;[ 'confirmedCount', 'deadCount', 'curedCount' ].forEach((metric) => {
        data_france[en2zh['Overseas France']][metric] = _.mergeWith(
            data_france[en2zh['Overseas France']][metric],
            Object.keys(data[en2zh['France']][en2zh[region]][metric])
                .filter((d) => d in data_france[en2zh['Overseas France']][metric])
                .reduce((obj, d) => {
                    obj[d] = data[en2zh['France']][en2zh[region]][metric][d]
                    return obj
                }, {}),
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

const spain_file = 'public/data/spain.json'
let spainData = JSON.parse(fs.readFileSync(spain_file))
data[en2zh['Spain']] = {
    ...spainData,
    ...data[en2zh['Spain']]
}

const switzerland_file = 'public/data/switzerland.json'
let switzerlandData = JSON.parse(fs.readFileSync(switzerland_file))
data[en2zh['Switzerland']] = {
    ...switzerlandData,
    ...data[en2zh['Switzerland']]
}

const uk_file = 'public/data/uk.json'
let ukData = JSON.parse(fs.readFileSync(uk_file))
let data_uk = {
    ...ukData,
    confirmedCount: data[en2zh['United Kingdom']].confirmedCount,
    curedCount: data[en2zh['United Kingdom']].curedCount,
    deadCount: data[en2zh['United Kingdom']].deadCount
}

Object.keys(data[en2zh['United Kingdom']])
    .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH', en2zh['United Kingdom'] ].includes(x))
    .forEach((region) => {
        if (region !== en2zh['Channel Islands'] && region !== en2zh['Isle of Man']) {
            data_uk[en2zh['Overseas Territories']][region] = data[en2zh['United Kingdom']][region]
            ;[ 'confirmedCount', 'deadCount', 'curedCount' ].forEach((metric) => {
                data_uk[en2zh['Overseas Territories']][metric] = _.mergeWith(
                    {},
                    data_uk[en2zh['Overseas Territories']][metric],
                    data[en2zh['United Kingdom']][region][metric],
                    _.add
                )
            })
        } else {
            data_uk[en2zh['Crown Dependencies']][region] = data[en2zh['United Kingdom']][region]
            ;[ 'confirmedCount', 'deadCount', 'curedCount' ].forEach((metric) => {
                data_uk[en2zh['Crown Dependencies']][metric] = _.mergeWith(
                    {},
                    data_uk[en2zh['Crown Dependencies']][metric],
                    data[en2zh['United Kingdom']][region][metric],
                    _.add
                )
            })
        }
    })
data[en2zh['United Kingdom']] = data_uk

const netherlands_file = 'public/data/netherlands.json'
let netherlandsData = JSON.parse(fs.readFileSync(netherlands_file))
data[en2zh['Netherlands']][en2zh['Netherlands']] = {
    ...netherlandsData,
    ...data[en2zh['Netherlands']][en2zh['Netherlands']]
}

const sweden_file = 'public/data/sweden.json'
let swedenData = JSON.parse(fs.readFileSync(sweden_file))
data[en2zh['Sweden']] = {
    ...swedenData,
    ...data[en2zh['Sweden']]
}

const poland_file = 'public/data/poland.json'
let polandData = JSON.parse(fs.readFileSync(poland_file))
data[en2zh['Poland']] = {
    ...polandData,
    ...data[en2zh['Poland']]
}

const norway_file = 'public/data/norway.json'
let norwayData = JSON.parse(fs.readFileSync(norway_file))
data[en2zh['Norway']] = {
    ...norwayData,
    ...data[en2zh['Norway']]
}

const iran_file = 'public/data/iran.json'
let iranData = JSON.parse(fs.readFileSync(iran_file))
data[en2zh['Iran']] = {
    ...iranData,
    ...data[en2zh['Iran']]
}

const portugal_file = 'public/data/portugal.json'
let portugalData = JSON.parse(fs.readFileSync(portugal_file))
data[en2zh['Portugal']] = {
    ...portugalData,
    ...data[en2zh['Portugal']]
}

const brazil_file = 'public/data/brazil.json'
let brazilData = JSON.parse(fs.readFileSync(brazil_file))
data[en2zh['Brazil']] = {
    ...brazilData,
    ...data[en2zh['Brazil']]
}

const malaysia_file = 'public/data/malaysia.json'
let malaysiaData = JSON.parse(fs.readFileSync(malaysia_file))
data[en2zh['Malaysia']] = {
    ...malaysiaData,
    ...data[en2zh['Malaysia']]
}

const chile_file = 'public/data/chile.json'
let chileData = JSON.parse(fs.readFileSync(chile_file))
data[en2zh['Chile']] = {
    ...chileData,
    ...data[en2zh['Chile']]
}

const belgium_file = 'public/data/belgium.json'
let belgiumData = JSON.parse(fs.readFileSync(belgium_file))
data[en2zh['Belgium']] = {
    ...belgiumData,
    ...data[en2zh['Belgium']]
}

const czechia_file = 'public/data/czechia.json'
let czechiaData = JSON.parse(fs.readFileSync(czechia_file))
data[en2zh['Czechia']] = {
    ...czechiaData,
    ...data[en2zh['Czechia']]
}

const russia_file = 'public/data/russia.json'
let russiaData = JSON.parse(fs.readFileSync(russia_file))
data[en2zh['Russia']] = {
    ...russiaData,
    ...data[en2zh['Russia']]
}

const latam_file = 'public/data/latin_america.json'
let latamData = JSON.parse(fs.readFileSync(latam_file))
Object.keys(latamData).forEach((country) => {
    data[country] = {
        ...latamData[country],
        ...data[country]
    }
})

const india_file = 'public/data/india.json'
let indiaData = JSON.parse(fs.readFileSync(india_file))
data[en2zh['India']] = {
    ...indiaData,
    ...data[en2zh['India']]
}

const ireland_file = 'public/data/ireland.json'
let irelandData = JSON.parse(fs.readFileSync(ireland_file))
data[en2zh['Ireland']] = {
    ...irelandData,
    ...data[en2zh['Ireland']]
}

const south_africa_file = 'public/data/south_africa.json'
let southAfricaData = JSON.parse(fs.readFileSync(south_africa_file))
data[en2zh['South Africa']] = {
    ...southAfricaData,
    ...data[en2zh['South Africa']]
}

const philippines_file = 'public/data/philippines.json'
let philippinesData = JSON.parse(fs.readFileSync(philippines_file))
data[en2zh['Philippines']] = {
    ...philippinesData,
    ...data[en2zh['Philippines']]
}

const romania_file = 'public/data/romania.json'
let romaniaData = JSON.parse(fs.readFileSync(romania_file))
data[en2zh['Romania']] = {
    ...romaniaData,
    ...data[en2zh['Romania']]
}

const indonesia_file = 'public/data/indonesia.json'
let indonesiaData = JSON.parse(fs.readFileSync(indonesia_file))
data[en2zh['Indonesia']] = {
    ...indonesiaData,
    ...data[en2zh['Indonesia']]
}

const saudi_arabia_file = 'public/data/saudi_arabia.json'
let saudiArabiaData = JSON.parse(fs.readFileSync(saudi_arabia_file))
data[en2zh['Saudi Arabia']] = {
    ...saudiArabiaData,
    ...data[en2zh['Saudi Arabia']]
}

const thailand_file = 'public/data/thailand.json'
let thailandData = JSON.parse(fs.readFileSync(thailand_file))
data[en2zh['Thailand']] = {
    ...thailandData,
    ...data[en2zh['Thailand']]
}

const merged_file_minified = 'public/data/all_minified.json'
fs.writeFileSync(merged_file_minified, JSON.stringify(data))
