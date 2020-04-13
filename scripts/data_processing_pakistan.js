const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/pakistan-data/data'
const data_file = 'covid-19-pakistan-data.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))
en2zh['Punjab'] = '旁遮普省'

let output_pakistan = {
    ENGLISH: 'Pakistan',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const regions = {
    SINDH: 'Sindh',
    PUNJAB: 'Punjab',
    BALOCHISTAN: 'Balochistan',
    KP: 'Khyber Pakhtunkhwa',
    ISLAMABAD: 'Islamabad',
    GB: 'Gilgit-Baltistan',
    AJK: 'Azad Kashmir'
}

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

data.forEach((line, index) => {
    if (line === '' || index === 0) return
    const lineSplit = line.split(',')

    const date = lineSplit[0].split('-').reverse().join('-')
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    const confirmedCount = parseInt(lineSplit[3], 10)
    const curedCount = parseInt(lineSplit[5], 10)
    const deadCount = parseInt(lineSplit[6], 10)

    const regionEnglish = regions[lineSplit[1]]
    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    if (!(region in output_pakistan)) {
        output_pakistan[region] = {
            ENGLISH: regionEnglish,
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }
    }

    output_pakistan[region]['confirmedCount'][date] = confirmedCount
    output_pakistan[region]['curedCount'][date] = curedCount
    output_pakistan[region]['deadCount'][date] = deadCount
})

fs.writeFileSync(`public/data/pakistan.json`, JSON.stringify(output_pakistan))

// modify map
const mapName = 'gadm36_PAK_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

const name_changes = {
    Baluchistan: 'Balochistan',
    Sind: 'Sindh',
    'Northern Areas': 'Gilgit-Baltistan',
    'F.A.T.A.': 'Khyber Pakhtunkhwa',
    'N.W.F.P.': 'Khyber Pakhtunkhwa',
    'F.C.T.': 'Islamabad'
}

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    if (regionEnglish in name_changes) regionEnglish = name_changes[regionEnglish]

    const region = en2zh[regionEnglish]
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_pakistan) {
        geo.properties.REGION = `巴基斯坦.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
