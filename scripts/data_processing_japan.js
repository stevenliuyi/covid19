const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/japan-data'
let data_files = fs.readdirSync(data_folder)
data_files = data_files.filter((filename) => filename.endsWith('.csv'))

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

// initialization
let output_japan = {}
output_japan = {
    ENGLISH: 'Japan',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const name_changes = {
    Eihime: 'Ehime'
}

data_files.forEach((data_file) => {
    const date = data_file.split('.')[0]
    const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)
    data.forEach((line, index) => {
        if (index === 0 || line === '') return
        const lineSplit = line.split(',')
        let regionEnglish = lineSplit[0].replace(/"/g, '')
        if (regionEnglish in name_changes) regionEnglish = name_changes[regionEnglish]

        const confirmedCount = parseInt(lineSplit[2], 10)
        const curedCount = parseInt(lineSplit[4], 10)
        const deadCount = parseInt(lineSplit[5], 10)

        const region = en2zh[regionEnglish]
        assert(region != null, `${regionEnglish} does not exist!`)

        if (!(region in output_japan)) {
            output_japan[region] = {
                ENGLISH: regionEnglish,
                confirmedCount: {},
                curedCount: {},
                deadCount: {}
            }
        }

        output_japan[region]['confirmedCount'][date] = confirmedCount
        output_japan[region]['curedCount'][date] = curedCount
        output_japan[region]['deadCount'][date] = deadCount
    })
})

fs.writeFileSync(`public/data/japan.json`, JSON.stringify(output_japan))

// modify map
const mapName = 'gadm36_JPN_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1

    if (regionEnglish === 'Hyōgo') regionEnglish = 'Hyogo'
    if (regionEnglish === 'Naoasaki') regionEnglish = 'Nagasaki'

    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region
    geo.properties.REGION = `日本.${region}`
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
