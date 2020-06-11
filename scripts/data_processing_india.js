const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/india-data'
const data_file = 'raw.json'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_india = {
    ENGLISH: 'India',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const name_changes = {
    Telengana: 'Telangana',
    'Dadar Nagar Haveli': 'Dadra and Nagar Haveli',
    'Daman & Diu': 'Daman and Diu'
}

const data = JSON.parse(fs.readFileSync(`${data_folder}/${data_file}`))
data.forEach((record, index) => {
    const date = record['day']
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    record['regional'].forEach((regionRecord) => {
        let regionEnglish = regionRecord.loc.replace('#', '')
        if (regionEnglish in name_changes) regionEnglish = name_changes[regionEnglish]
        const region = en2zh[regionEnglish]
        assert(region != null, `${regionEnglish} does not exist!`)

        const confirmedCount = regionRecord['totalConfirmed']
        const curedCount = regionRecord['discharged']
        const deadCount = regionRecord['deaths']

        if (!(region in output_india)) {
            output_india[region] = {
                ENGLISH: regionEnglish,
                confirmedCount: {},
                curedCount: {},
                deadCount: {}
            }
        }

        output_india[region]['confirmedCount'][date] = confirmedCount
        output_india[region]['curedCount'][date] = curedCount
        output_india[region]['deadCount'][date] = deadCount
    })
})

fs.writeFileSync(`public/data/india.json`, JSON.stringify(output_india))

// modify map
let map = JSON.parse(fs.readFileSync('data/maps/india.json'))
const objName = 'india'
let geometries = map.objects[objName].geometries

geometries.forEach((geo) => {
    const regionEnglish = geo.properties.st_nm
    if (regionEnglish === 'Hello') return

    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    geo.properties.CHINESE_NAME = region
    if (region in output_india) {
        geo.properties.REGION = `印度.${region}`
    }
})
map.objects[objName].geometries = geometries
fs.writeFileSync('public/maps/IND.json', JSON.stringify(map))
