const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/latvia-data'
const data_file = 'raw.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))
en2zh['Adrese nav norādīta'] = '未明确地区'

const UNDEFINED_REGION = 'Adrese nav norādīta'

const latviaRegions = {
    Kurzeme: [
        'Aizputes novads',
        'Alsungas novads',
        'Brocēnu novads',
        'Dundagas novads',
        'Durbes novads',
        'Grobiņas novads',
        'Kuldīgas novads',
        'Liepāja',
        'Mērsraga novads',
        'Nīcas novads',
        'Pāvilostas novads',
        'Priekules novads',
        'Rojas novads',
        'Rucavas novads',
        'Saldus novads',
        'Skrundas novads',
        'Talsu novads',
        'Vaiņodes novads',
        'Ventspils',
        'Ventspils novads'
    ],
    Zemgale: [
        'Aizkraukles novads',
        'Aknīstes novads',
        'Auces novads',
        'Bauskas novads',
        'Dobeles novads',
        'Iecavas novads',
        'Jaunjelgavas novads',
        'Jelgava',
        'Jelgavas novads',
        'Jēkabpils',
        'Jēkabpils novads',
        'Kokneses novads',
        'Krustpils novads',
        'Neretas novads',
        'Ozolnieku novads',
        'Pļaviņu novads',
        'Rundāles novads',
        'Salas novads',
        'Skrīveru novads',
        'Tērvetes novads',
        'Vecumnieku novads',
        'Viesītes novads'
    ],
    Latgale: [
        'Aglonas novads',
        'Baltinavas novads',
        'Balvu novads',
        'Ciblas novads',
        'Dagdas novads',
        'Daugavpils',
        'Daugavpils novads',
        'Ilūkstes novads',
        'Kārsavas novads',
        'Krāslavas novads',
        'Līvānu novads',
        'Ludzas novads',
        'Preiļu novads',
        'Rēzekne',
        'Rēzeknes novads',
        'Riebiņu novads',
        'Rugāju novads',
        'Vārkavas novads',
        'Viļakas novads',
        'Viļānu novads',
        'Zilupes novads'
    ],
    Vidzeme: [
        'Alūksnes novads',
        'Amatas novads',
        'Apes novads',
        'Beverīnas novads',
        'Burtnieku novads',
        'Cēsu novads',
        'Cesvaines novads',
        'Ērgļu novads',
        'Gulbenes novads',
        'Jaunpiebalgas novads',
        'Kocēnu novads',
        'Līgatnes novads',
        'Lubānas novads',
        'Madonas novads',
        'Mazsalacas novads',
        'Naukšēnu novads',
        'Pārgaujas novads',
        'Priekuļu novads',
        'Raunas novads',
        'Rūjienas novads',
        'Smiltenes novads',
        'Strenču novads',
        'Valkas novads',
        'Valmiera',
        'Varakļānu novads',
        'Vecpiebalgas novads'
    ],
    Riga: [
        'Ādažu novads',
        'Alojas novads',
        'Babītes novads',
        'Baldones novads',
        'Carnikavas novads',
        'Engures novads',
        'Garkalnes novads',
        'Ikšķiles novads',
        'Inčukalna novads',
        'Jaunpils novads',
        'Jūrmala',
        'Kandavas novads',
        'Krimuldas novads',
        'Ķeguma novads',
        'Ķekavas novads',
        'Limbažu novads',
        'Lielvārdes novads',
        'Mālpils novads',
        'Mārupes novads',
        'Rīga',
        'Ropažu novads',
        'Salacgrīvas novads',
        'Salaspils novads',
        'Saulkrastu novads',
        'Stopiņu novads',
        'Sējas novads',
        'Siguldas novads',
        'Tukuma novads',
        'Ogres novads',
        'Olaines novads'
    ]
}

let output_latvia = {
    ENGLISH: 'Latvia',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

Object.keys(latviaRegions).forEach((regionEnglish) => {
    const region = en2zh[regionEnglish]
    output_latvia[region] = {
        ENGLISH: regionEnglish,
        confirmedCount: {},
        curedCount: {},
        deadCount: {}
    }
})

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

data.forEach((line, index) => {
    if (index === 0 || line === '') return
    const lineSplit = line.split(';')

    if (lineSplit[0] === '' || lineSplit[3] === '') return
    const date = lineSplit[0].slice(0, -1).replace(/\./g, '-')
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    const cityEnglish = lineSplit[1]
    let regionEnglish = Object.keys(latviaRegions).find((t) => latviaRegions[t].includes(cityEnglish))
    if (cityEnglish === UNDEFINED_REGION) return
    assert(regionEnglish != null, `${regionEnglish} does not exist!`)

    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    let confirmedCount = parseInt(lineSplit[3], 10)
    if (lineSplit[3] === 'no 1 līdz 5') confirmedCount = 1
    assert(!isNaN(confirmedCount), `${lineSplit[3]} is not a valid count!`)

    if (!(cityEnglish in output_latvia[region])) {
        output_latvia[region][cityEnglish] = {
            ENGLISH: cityEnglish,
            confirmedCount: {},
            deadCount: {},
            curedCount: {}
        }
    }

    output_latvia[region][cityEnglish]['confirmedCount'][date] = confirmedCount

    if (!(date in output_latvia[region]['confirmedCount'])) output_latvia[region]['confirmedCount'][date] = 0

    output_latvia[region]['confirmedCount'][date] += confirmedCount
})

fs.writeFileSync(`public/data/latvia.json`, JSON.stringify(output_latvia))

// modify map
const mapName = 'gadm36_LVA_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1

    const region = en2zh[regionEnglish]
    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region
    assert(region != null, `${regionEnglish} does not exist!`)

    if (region in output_latvia) {
        geo.properties.REGION = `拉脱维亚.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
