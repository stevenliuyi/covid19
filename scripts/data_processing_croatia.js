const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/croatia-data'
const data_file = 'raw.json'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_croatia = {
    ENGLISH: 'Croatia',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const name_changes = {
    'Krapinsko-Zagorska županija': 'Krapinsko-Zagorska'
}

const data = JSON.parse(fs.readFileSync(`${data_folder}/${data_file}`))
data.forEach((record, index) => {
    const date = record['Datum'].substr(0, 10)
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    record['PodaciDetaljno'].forEach((regionRecord, i) => {
        let regionEnglish = regionRecord['Zupanija'].trim()
        regionEnglish = regionEnglish.replace(/-./, (v) => v.toUpperCase())
        if (regionEnglish in name_changes) regionEnglish = name_changes[regionEnglish]

        const region = en2zh[regionEnglish]
        assert(region != null, `${regionEnglish} does not exist!`)

        if (!(region in output_croatia)) {
            output_croatia[region] = {
                ENGLISH: regionEnglish,
                confirmedCount: {},
                curedCount: {},
                deadCount: {}
            }
        }

        output_croatia[region]['confirmedCount'][date] = parseInt(regionRecord['broj_zarazenih'], 10)
        output_croatia[region]['deadCount'][date] = parseInt(regionRecord['broj_umrlih'], 10)
    })
})

fs.writeFileSync(`public/data/croatia.json`, JSON.stringify(output_croatia))

// modify map
const mapName = 'gadm36_HRV_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

const map_name_changes = {
    'Bjelovarska-Bilogorska': 'Bjelovarsko-Bilogorska',
    'Dubrovacko-Neretvanska': 'Dubrovačko-Neretvanska',
    Karlovacka: 'Karlovačka',
    'Licko-Senjska': 'Ličko-Senjska',
    Medimurska: 'Međimurska',
    'Osjecko-Baranjska': 'Osječko-Baranjska',
    'Sisacko-Moslavacka': 'Sisačko-Moslavačka',
    'Viroviticko-Podravska': 'Virovitičko-Podravska'
}

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    if (regionEnglish in map_name_changes) regionEnglish = map_name_changes[regionEnglish]

    const region = en2zh[regionEnglish]
    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region
    assert(region != null, `${regionEnglish} does not exist!`)

    if (region in output_croatia) {
        geo.properties.REGION = `克罗地亚.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
