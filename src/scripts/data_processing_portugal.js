const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/portugal-data'
const data_file = 'data.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))
en2zh['Foreigners'] = '外国人'

let output_portugal = {}
output_portugal = {
    ENGLISH: 'Portugal',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const region_names = {
    arsnorte: 'Norte',
    arscentro: 'Centro',
    arslvt: 'Lisbon and Tagus Valley',
    arsalentejo: 'Alentejo',
    arsalgarve: 'Algarve',
    acores: 'Azores',
    madeira: 'Madeira',
    estrangeiro: 'Foreigners'
}

Object.values(region_names).forEach((regionEnglish) => {
    output_portugal[en2zh[regionEnglish]] = {
        ENGLISH: regionEnglish,
        confirmedCount: {},
        deadCount: {},
        curedCount: {}
    }
})

let confirmedIndices = {}
let deadIndices = {}

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

data.forEach((line, index) => {
    if (line === '') return
    const lineSplit = line.split(',')

    if (index === 0) {
        lineSplit.forEach((x, i) => {
            const confirmed_splitted = x.split('confirmados')
            if (confirmed_splitted.length === 2) {
                if (confirmed_splitted[1] === '') {
                    // total
                    confirmedIndices['total'] = i
                } else {
                    // regional
                    const region = confirmed_splitted[1].slice(1)
                    if (region in region_names) confirmedIndices[region] = i
                }
            }

            const dead_splitted = x.split('obitos')
            if (dead_splitted.length === 2) {
                if (dead_splitted[1] === '') {
                    // total
                    deadIndices['total'] = i
                } else {
                    // regional
                    const region = dead_splitted[1].slice(1)
                    if (region in region_names) deadIndices[region] = i
                }
            }
        })
    } else {
        let date = lineSplit[0]
        date = `${date.slice(6, 10)}-${date.slice(3, 5)}-${date.slice(0, 2)}`
        assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

        Object.keys(region_names).forEach((x) => {
            const confirmedCount = parseInt(lineSplit[confirmedIndices[x]], 10)
            const deadCount = parseInt(lineSplit[deadIndices[x]], 10)
            if (!isNaN(confirmedCount)) output_portugal[en2zh[region_names[x]]]['confirmedCount'][date] = confirmedCount
            if (!isNaN(deadCount)) output_portugal[en2zh[region_names[x]]]['deadCount'][date] = deadCount
        })

        const totalConfirmedCount = parseInt(lineSplit[confirmedIndices['total']], 10)
        const totalDeadCount = parseInt(lineSplit[deadIndices['total']], 10)
        if (!isNaN(totalConfirmedCount)) output_portugal['confirmedCount'][date] = totalConfirmedCount
        if (!isNaN(totalDeadCount)) output_portugal['deadCount'][date] = totalDeadCount
    }
})

fs.writeFileSync(`public/data/portugal.json`, JSON.stringify(output_portugal))

// modify map
const mapName = 'gadm36_PRT_2'
let map = JSON.parse(fs.readFileSync(`public/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

const districts = {
    Aveiro: 'Centro',
    Azores: 'Azores',
    Beja: 'Alentejo',
    Braga: 'Norte',
    Bragança: 'Norte',
    'Castelo Branco': 'Centro',
    Coimbra: 'Centro',
    Évora: 'Alentejo',
    Faro: 'Algarve',
    Guarda: 'Centro',
    Leiria: 'Centro',
    Lisboa: 'Lisbon and Tagus Valley',
    Madeira: 'Madeira',
    Portalegre: 'Alentejo',
    Porto: 'Norte',
    Santarém: 'Lisbon and Tagus Valley',
    Setúbal: 'Alentejo',
    'Viana do Castelo': 'Norte',
    'Vila Real': 'Norte',
    Viseu: 'Centro'
}

const citiesLisbon = [
    'Alcobaça',
    'Caldas da Rainha',
    'Nazaré',
    'Óbidos',
    'Peniche',
    'Bombarral',
    'Montijo',
    'Palmela',
    'Setúbal',
    'Moita',
    'Alcochete',
    'Seixal',
    'Almada',
    'Sesimbra',
    'Alentejo'
]

const citiesNorte = [
    'Arouca',
    'Castelo de Paiva',
    'Espinho',
    'Oliveira de Azeméis',
    'Santa Maria da Feira',
    'São João da Madeira',
    'Vale de Cambra',
    'Armamar',
    'Lamego',
    'Moimenta da Beira',
    'Penedono',
    'São João da Pesqueira',
    'Sernancelhe',
    'Tabuaço',
    'Tarouca',
    'Cinfães',
    'Resende'
]

geometries.forEach((geo) => {
    let district = geo.properties.NAME_1
    const city = geo.properties.NAME_2

    let regionEnglish = districts[district]
    if (citiesLisbon.includes(city)) regionEnglish = 'Lisbon and Tagus Valley'
    if (citiesNorte.includes(city)) regionEnglish = 'Norte'

    const region = en2zh[regionEnglish]

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    assert(region != null, `${regionEnglish} does not exist!`)

    if (region in output_portugal) {
        geo.properties.REGION = `葡萄牙.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
