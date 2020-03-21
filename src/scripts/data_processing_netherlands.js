const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/eu-data/dataset'
const data_file = 'covid-19-nl.csv'

// translations
// const en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_netherlands = {}
output_netherlands = {
    ENGLISH: 'Netherlands',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const splitCSV = function(string) {
    var matches = string.match(/(\s*"[^"]+"\s*|\s*[^,]+|,)(?=,|$)/g)
    for (var n = 0; n < matches.length; ++n) {
        matches[n] = matches[n].trim()
        if (matches[n] === ',') matches[n] = ''
    }
    if (string[0] === ',') matches.unshift('')
    return matches
}

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

data.forEach((line, index) => {
    if (index === 0 || line === '') return
    const lineSplit = splitCSV(line)

    const regionEnglish = lineSplit[1].replace(/"/g, '')
    const confirmedCount = parseInt(lineSplit[2], 10)
    const date = lineSplit[5].slice(0, 10)
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    if (regionEnglish === 'sum') {
        output_netherlands['confirmedCount'][date] = confirmedCount
    } else {
        const region = regionEnglish

        if (!(region in output_netherlands)) {
            output_netherlands[region] = { ENGLISH: regionEnglish, confirmedCount: {}, curedCount: {}, deadCount: {} }
        }
        output_netherlands[region]['confirmedCount'][date] = confirmedCount
    }
})

fs.writeFileSync(`public/data/netherlands.json`, JSON.stringify(output_netherlands))

// modify map
const mapName = 'gadm36_NLD_2'
let map = JSON.parse(fs.readFileSync(`public/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    const provinceEnglish = geo.properties.NAME_1
    let regionEnglish = geo.properties.NAME_2
    const region = regionEnglish

    if (regionEnglish === 'Dantumadeel') regionEnglish = 'Dantumadiel'
    if (regionEnglish === 'Leeuwarderadeel') regionEnglish = 'Leeuwarden'
    if (regionEnglish === 'Nuenen c.a.') regionEnglish = 'Nuenen, Gerwen en Nederwetten'

    if (regionEnglish === 'Bergen' && provinceEnglish === 'Limburg') regionEnglish = 'Bergen (L)'
    if (regionEnglish === 'Bergen' && provinceEnglish === 'Noord-Holland') regionEnglish = 'Bergen (NH)'

    geo.properties.NAME_2 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_netherlands) {
        geo.properties.REGION = `荷兰.荷兰.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
