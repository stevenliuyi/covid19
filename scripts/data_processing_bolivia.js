const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/bolivia-data'
const data_file = 'data.json'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_bolivia = {
    ENGLISH: 'Bolivia',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const metrics = {
    confirmedCount: 'confirmados',
    deadCount: 'decesos',
    curedCount: 'recuperados'
}

const data = JSON.parse(fs.readFileSync(`${data_folder}/${data_file}`))

Object.keys(metrics).forEach((metric) => {
    data[metrics[metric]].forEach((regionData) => {
        const date = regionData['fecha']
        assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

        Object.keys(regionData['dep']).forEach((reg) => {
            const regionEnglish = reg.split('_').map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(' ')
            const region = en2zh[regionEnglish]
            assert(region != null, `${regionEnglish} does not exist!`)

            if (!(region in output_bolivia)) {
                output_bolivia[region] = {
                    ENGLISH: regionEnglish,
                    confirmedCount: {},
                    deadCount: {},
                    curedCount: {}
                }
            }

            output_bolivia[region][metric][date] = regionData['dep'][reg]
        })
    })
})

fs.writeFileSync(`public/data/bolivia.json`, JSON.stringify(output_bolivia))

// modify map
const mapName = 'gadm36_BOL_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

const name_changes = {
    'El Beni': 'Beni'
}

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    if (regionEnglish in name_changes) regionEnglish = name_changes[regionEnglish]
    const region = en2zh[regionEnglish]

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region
    assert(region != null, `${regionEnglish} does not exist!`)

    if (region in output_bolivia) {
        geo.properties.REGION = `玻利维亚.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
