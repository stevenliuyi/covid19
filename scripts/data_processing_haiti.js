const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/haiti-data'

const history_data_file = 'history-by-region.json'

let data_files = fs.readdirSync(data_folder)
data_files = data_files.filter((filename) => filename.endsWith('.json') && filename.startsWith('20'))
data_files.sort()

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_haiti = {
    ENGLISH: 'Haiti',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const history_data = JSON.parse(fs.readFileSync(`${data_folder}/${history_data_file}`))
Object.keys(history_data).forEach((regionEnglish) => {
    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)
    history_data[regionEnglish].reverse().forEach((record) => {
        let date = record.date.split('/')
        date = `${date[2]}-${date[0].padStart(2, '0')}-${date[1].padStart(2, '0')}`
        assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

        if (!(region in output_haiti)) {
            output_haiti[region] = {
                ENGLISH: regionEnglish,
                confirmedCount: {},
                deadCount: {},
                curedCount: {}
            }
        }

        output_haiti[region]['confirmedCount'][date] = record.cases
        output_haiti[region]['deadCount'][date] = record.death
        output_haiti[region]['curedCount'][date] = record.recovered
    })
})

data_files.forEach((data_file) => {
    const date = data_file.slice(0, 10)
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    const data = JSON.parse(fs.readFileSync(`${data_folder}/${data_file}`))

    data.forEach((record) => {
        const regionEnglish = record.region
        if (regionEnglish == null) return
        const region = en2zh[regionEnglish]
        assert(region != null, `${regionEnglish} does not exist!`)

        output_haiti[region]['confirmedCount'][date] = record.cases
        output_haiti[region]['deadCount'][date] = record.death
        output_haiti[region]['curedCount'][date] = record.recovered
    })
})

fs.writeFileSync(`public/data/haiti.json`, JSON.stringify(output_haiti))

// modify map
const mapName = 'gadm36_HTI_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1.replace(/'/g, '')
    if (regionEnglish === 'GrandAnse') regionEnglish = 'Grand-Anse'
    if (regionEnglish === 'LArtibonite') regionEnglish = 'Artibonite'

    const region = en2zh[regionEnglish]
    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region
    assert(region != null, `${regionEnglish} does not exist!`)

    if (region in output_haiti) {
        geo.properties.REGION = `海地.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
