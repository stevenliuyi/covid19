const fs = require('fs')
const assert = require('assert')

function parseDate(date) {
    const [ year, month, day ] = date.substr(0, 10).split('-')
    return new Date(year, month - 1, day)
}

const data_folder = 'data/russia-data/csse_covid_19_data/csse_covid_19_daily_reports'
let data_files = fs.readdirSync(data_folder)

data_files = data_files.filter((filename) => filename.endsWith('.csv')).filter((filename) => {
    let date = filename.split('.')[0]
    date = `${date.slice(6, 10)}-${date.slice(0, 5)}`
    return parseDate(date) >= parseDate('2020-03-22')
})

// translations
const russia_subjects = JSON.parse(fs.readFileSync('data/map-translations/russia_federal_subjects.json'))

let output_russia = {}
output_russia = {
    ENGLISH: 'Russia',
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

data_files.forEach((data_file) => {
    let date = data_file.split('.')[0]
    date = `${date.slice(6, 10)}-${date.slice(0, 5)}`
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)
    data.forEach((line, index) => {
        if (index === 0 || line === '') return
        const lineSplit = splitCSV(line)

        const regionEnglish = lineSplit[2]
            .replace(/"/g, '')
            .trim()
            .replace('oblast', 'Oblast')
            .replace('republic', 'Republic')
            .replace('kray', 'Kray')
            .replace(' - ', '-')
        const countryEnglish = lineSplit[3].replace(/"/g, '').trim()
        const confirmedCount = parseInt(lineSplit[7], 10)
        const deadCount = parseInt(lineSplit[8], 10)
        const curedCount = parseInt(lineSplit[9], 10)

        if (countryEnglish !== 'Russia' || regionEnglish === '') return

        const regionCode = Object.keys(russia_subjects).find((x) => russia_subjects[x].en === regionEnglish)
        const region = russia_subjects[regionCode].zh
        assert(region != null, `${regionEnglish} does not exist!`)

        if (!(region in output_russia)) {
            output_russia[region] = { ENGLISH: regionEnglish, confirmedCount: {}, curedCount: {}, deadCount: {} }
        }
        output_russia[region]['confirmedCount'][date] = confirmedCount
        output_russia[region]['deadCount'][date] = deadCount
        output_russia[region]['curedCount'][date] = curedCount
    })
})

fs.writeFileSync(`public/data/russia.json`, JSON.stringify(output_russia))
//
// modify map
const mapName = 'gadm36_RUS_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionCode = geo.properties.HASC_1
    if (geo.properties.NAME_1 === 'Moscow City') regionCode = 'RU.MC'
    const region = russia_subjects[regionCode].zh
    const regionEnglish = russia_subjects[regionCode].en
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_russia) {
        geo.properties.REGION = `俄罗斯.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
