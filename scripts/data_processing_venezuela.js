const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/venezuela-data'
let data_files = fs.readdirSync(data_folder)
data_files = data_files.filter((filename) => filename.endsWith('.json'))
data_files.sort()

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))
en2zh['Amazonas'] = '亚马孙州'
en2zh['Sucre'] = '苏克雷州'

let output_venezuela = {
    ENGLISH: 'Venezuela',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const name_changes = {
    'Distrito Capital': 'Capital District',
    'Los Roques': 'Federal Dependencies'
}

data_files.forEach((data_file) => {
    const date = data_file.slice(0, 10)
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    const data = JSON.parse(fs.readFileSync(`${data_folder}/${data_file}`))

    Object.keys(data['Confirmed']['ByState']).forEach((regionES) => {
        let regionEnglish = regionES
        if (regionEnglish in name_changes) regionEnglish = name_changes[regionEnglish]
        const region = en2zh[regionEnglish]
        assert(region != null, `${regionEnglish} does not exist!`)

        if (!(region in output_venezuela)) {
            output_venezuela[region] = {
                ENGLISH: regionEnglish,
                confirmedCount: {},
                curedCount: {},
                deadCount: {}
            }
        }

        output_venezuela[region]['confirmedCount'][date] = data['Confirmed']['ByState'][regionES]
    })
})

fs.writeFileSync(`public/data/venezuela.json`, JSON.stringify(output_venezuela))

// modify map
// const mapName = 'gadm36_VEN_1'
// let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
// let geometries = map.objects[mapName].geometries
//
// geometries.forEach((geo) => {
//     let regionEnglish = geo.properties.NAME_1
//     const region = en2zh[regionEnglish]
//
//     geo.properties.NAME_1 = regionEnglish
//     geo.properties.CHINESE_NAME = region
//     assert(region != null, `${regionEnglish} does not exist!`)
//
//     if (region in output_venezuela) {
//         geo.properties.REGION = `委内瑞拉.${region}`
//     }
// })
//
// map.objects[mapName].geometries = geometries
// fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
