const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/finland-data'
const data_file = 'raw.csv'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

const fi2en = {
    Ahvenanmaa: 'Åland',
    'Varsinais-Suomen SHP': 'Varsinais-Suomi Hospital District',
    'Satakunnan SHP': 'Satakunta Hospital District',
    'Kanta-Hämeen SHP': 'Kanta-Häme Hospital District',
    'Pirkanmaan SHP': 'Pirkanmaa Hospital District',
    'Päijät-Hämeen SHP': 'Päijät-Häme Hospital District',
    'Kymenlaakson SHP': 'Kymenlaakso Hospital District',
    'Etelä-Karjalan SHP': 'South Karelia Hospital District',
    'Etelä-Savon SHP': 'Etelä-Savo Hospital District',
    'Itä-Savon SHP': 'Itä-Savo Hospital District',
    'Pohjois-Karjalan SHP': 'North Karelia Hospital District',
    'Pohjois-Savon SHP': 'Pohjois-Savo Hospital District',
    'Keski-Suomen SHP': 'Central Finland Hospital District',
    'Etelä-Pohjanmaan SHP': 'South Ostrobothnia Hospital District',
    'Vaasan SHP': 'Vaasa Hospital District',
    'Keski-Pohjanmaan SHP': 'Central Ostrobothnia Hospital District',
    'Pohjois-Pohjanmaan SHP': 'North Ostrobothnia Hospital District',
    'Kainuun SHP': 'Kainuu Hospital District',
    'Länsi-Pohjan SHP': 'Länsi-Pohja Hospital District',
    'Lapin SHP': 'Lappi Hospital District',
    'Helsingin ja Uudenmaan SHP': 'Helsinki and Uusimaa Hospital District',
    'Kaikki Alueet': 'All areas'
}

function parseDate(date) {
    const [ year, month, day ] = date.substr(0, 10).split('-')
    return new Date(year, month - 1, day)
}

let currDate = new Date()
currDate.setHours(currDate.getHours() - 7)
currDate = currDate.toISOString().slice(0, 10)
currDate = parseDate(currDate)

let output_finland = {
    ENGLISH: 'Finland',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

data.forEach((line, index) => {
    if (index === 0 || line === '') return

    const lineSplit = line.split(';')
    const regionEnglish = fi2en[lineSplit[0]]
    const date = lineSplit[1]
    let confirmedCount = parseInt(lineSplit[2], 10)
    if (isNaN(confirmedCount)) confirmedCount = 0

    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)
    if (parseDate(date) > currDate || parseDate(date) <= parseDate('2020-01-27')) return

    assert(regionEnglish != null, `${regionEnglish} does not exist!`)
    if (regionEnglish === 'All areas') return

    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)

    if (!(region in output_finland)) {
        output_finland[region] = {
            ENGLISH: regionEnglish,
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }
    }

    output_finland[region]['confirmedCount'][date] = confirmedCount // daily count
})

// calculate cumulative counts
Object.keys(output_finland)
    .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH' ].includes(x))
    .forEach((region) => {
        const dates = Object.keys(output_finland[region]['confirmedCount'])
        const firstDate = dates[0]
        const lastDate = dates[dates.length - 1]

        let currentDate = firstDate
        let prevDate = null
        while (parseDate(currentDate) <= parseDate(lastDate)) {
            if (currentDate !== firstDate) {
                if (!(currentDate in output_finland[region]['confirmedCount'])) {
                    output_finland[region]['confirmedCount'][currentDate] =
                        output_finland[region]['confirmedCount'][prevDate]
                } else {
                    output_finland[region]['confirmedCount'][currentDate] +=
                        output_finland[region]['confirmedCount'][prevDate]
                }
            }

            // next day
            prevDate = currentDate
            currentDate = parseDate(currentDate)
            currentDate.setDate(currentDate.getDate() + 1)
            currentDate = currentDate.toISOString().slice(0, 10)
        }
    })

fs.writeFileSync(`public/data/finland.json`, JSON.stringify(output_finland))

const name_changes = {
    Uusimaa: 'Helsinki and Uusimaa Hospital District',
    'Eastern Uusimaa': 'Helsinki and Uusimaa Hospital District',
    'Finland Proper': 'Varsinais-Suomi Hospital District',
    Satakunta: 'Satakunta Hospital District',
    'Tavastia Proper': 'Kanta-Häme Hospital District',
    Pirkanmaa: 'Pirkanmaa Hospital District',
    'Päijänne Tavastia': 'Päijät-Häme Hospital District',
    Kymenlaakso: 'Kymenlaakso Hospital District',
    'South Karelia': 'South Karelia Hospital District',
    'Southern Savonia': 'Etelä-Savo Hospital District',
    'North Karelia': 'North Karelia Hospital District',
    'North Savonia': 'Pohjois-Savo Hospital District',
    'Central Finland': 'Central Finland Hospital District',
    'Southern Ostrobothnia': 'South Ostrobothnia Hospital District',
    Ostrobothnia: 'Vaasa Hospital District',
    'Central Ostrobothnia': 'Central Ostrobothnia Hospital District',
    'Northern Ostrobothnia': 'North Ostrobothnia Hospital District',
    Kainuu: 'Kainuu Hospital District',
    Lapland: 'Lappi Hospital District'
}

// reference: https://fi.wikipedia.org/wiki/Sairaanhoitopiiri
const diff = {
    Myrskylä: 'Päijät-Häme Hospital District',
    Pukkila: 'Päijät-Häme Hospital District',
    Iitti: 'Päijät-Häme Hospital District',
    Punkalaidun: 'Varsinais-Suomi Hospital District',
    Jämsä: 'Pirkanmaa Hospital District',
    Jämsänkoski: 'Pirkanmaa Hospital District',
    Kuhmoinen: 'Pirkanmaa Hospital District',
    Heinävesi: 'North Karelia Hospital District',
    Kangaslampi: 'Pohjois-Savo Hospital District',
    Enonkoski: 'Itä-Savo Hospital District',
    Rantasalmi: 'Itä-Savo Hospital District',
    Savonlinna: 'Itä-Savo Hospital District',
    Kerimäki: 'Itä-Savo Hospital District',
    Punkaharju: 'Itä-Savo Hospital District',
    Savonranta: 'Itä-Savo Hospital District',
    Sulkava: 'Itä-Savo Hospital District',
    Isokyrö: 'South Ostrobothnia Hospital District',
    Kruunupyy: 'Central Ostrobothnia Hospital District',
    Reisjärvi: 'Central Ostrobothnia Hospital District',
    Vaala: 'North Ostrobothnia Hospital District',
    Keminmaa: 'Länsi-Pohja Hospital District',
    Simo: 'Länsi-Pohja Hospital District',
    Tervola: 'Länsi-Pohja Hospital District',
    Tornio: 'Länsi-Pohja Hospital District',
    Ylitornio: 'Länsi-Pohja Hospital District'
}

// modify map
const mapName = 'gadm36_FIN_4'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = name_changes[geo.properties.NAME_2]
    const cityEnglish = geo.properties.NAME_4
    if (cityEnglish in diff) regionEnglish = diff[cityEnglish]

    const region = en2zh[regionEnglish]
    geo.properties.NAME_2 = regionEnglish
    geo.properties.CHINESE_NAME = region
    assert(region != null, `${regionEnglish} does not exist!`)

    if (region in output_finland) {
        geo.properties.REGION = `芬兰.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
