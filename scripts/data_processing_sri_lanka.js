const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/sri-lanka-data'
let data_files = fs.readdirSync(data_folder)

data_files = data_files.filter((filename) => filename.endsWith('.csv'))
data_files.sort()

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_sri_lanka = {}
output_sri_lanka = {
    ENGLISH: 'Sri Lanka',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

data_files.forEach((data_file) => {
    let date = data_file.slice(0, 10)
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)
    data.forEach((line, index) => {
        if (line === '') return
        const lineSplit = line.split(',')

        let regionEnglish = lineSplit[0]
        regionEnglish = regionEnglish.charAt(0) + regionEnglish.slice(1).toLowerCase()

        if (regionEnglish === 'Kalmunai') regionEnglish = 'Ampara'
        const region = en2zh[regionEnglish]
        assert(!(region == null), `${regionEnglish} does not exist!`)

        const confirmedCount = parseInt(lineSplit[1], 10)
        assert(!isNaN(confirmedCount), `${lineSplit[1]} is not a valid count!`)

        if (!(region in output_sri_lanka)) {
            output_sri_lanka[region] = {
                ENGLISH: regionEnglish,
                confirmedCount: {},
                curedCount: {},
                deadCount: {}
            }
        }

        if (!(date in output_sri_lanka[region]['confirmedCount'])) output_sri_lanka[region]['confirmedCount'][date] = 0
        output_sri_lanka[region]['confirmedCount'][date] += confirmedCount
    })
})

fs.writeFileSync(`public/data/sri_lanka.json`, JSON.stringify(output_sri_lanka))

// modify map
const mapName = 'gadm36_LKA_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

const name_changes = {
    Batticaloa: 'Batticoloa',
    Mullaitivu: 'Mullativu',
    'Nuwara Eliya': 'Nuwaraeliya',
    Vavuniya: 'Vavunia'
}
geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    if (regionEnglish in name_changes) regionEnglish = name_changes[regionEnglish]
    const region = en2zh[regionEnglish]
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_sri_lanka) {
        geo.properties.REGION = `斯里兰卡.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
