const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/uk-data/data'
const data_file = 'covid-19-cases-uk.csv'
const data_total_file = 'covid-19-indicators-uk.csv'

// translations
const en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

const splitCSV = function(string) {
    var matches = string.match(/(\s*"[^"]+"\s*|\s*[^,]+|,)(?=,|$)/g)
    for (var n = 0; n < matches.length; ++n) {
        matches[n] = matches[n].trim()
        if (matches[n] === ',') matches[n] = ''
    }
    if (string[0] === ',') matches.unshift('')
    return matches
}

let output_uk = {}
output_uk = {
    ENGLISH: 'United Kingdom',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const regions = [ 'England', 'Scotland', 'Wales', 'Northern Ireland', 'Overseas Territories', 'Crown Dependencies' ]

// initialization
regions.forEach((x) => {
    output_uk[en2zh[x]] = {
        ENGLISH: x,
        confirmedCount: {},
        deadCount: {},
        curedCount: {}
    }
})

const sub_areas = {
    'Greater London': [
        'Barking and Dagenham',
        'Barnet',
        'Bexley',
        'Brent',
        'Bromley',
        'Camden',
        'Croydon',
        'Ealing',
        'Enfield',
        'Greenwich',
        'Hackney and City of London',
        'Hackney',
        'City of London',
        'Hammersmith and Fulham',
        'Haringey',
        'Harrow',
        'Havering',
        'Hillingdon',
        'Hounslow',
        'Islington',
        'Kensington and Chelsea',
        'Kingston upon Thames',
        'Lambeth',
        'Lewisham',
        'Merton',
        'Newham',
        'Redbridge',
        'Richmond upon Thames',
        'Southwark',
        'Sutton',
        'Tower Hamlets',
        'Waltham Forest',
        'Wandsworth',
        'Westminster'
    ]
}

Object.keys(sub_areas).forEach((x) => {
    output_uk['英格兰'][x] = {
        ENGLISH: x,
        confirmedCount: {},
        deadCount: {},
        curedCount: {}
    }
})

const name_changes = {
    'Herefordshire, County of': 'Herefordshire',
    'Kingston upon Hull, City of': 'Kingston upon Hull',
    'Bristol, City of': 'Bristol',
    'County Durham': 'Durham',
    'St. Helens': 'Saint Helens',
    'Cwm Taf Morgannwg': 'Cwm Taf'
}

const walesNHS = {
    'Aneurin Bevan': [ 'Blaenau Gwent', 'Caerphilly', 'Monmouthshire', 'Newport', 'Torfaen' ],
    'Betsi Cadwaladr': [ 'Isle of Anglesey', 'Conwy', 'Denbighshire', 'Flintshire', 'Gwynedd', 'Wrexham' ],
    'Cardiff and Vale': [ 'Cardiff', 'Vale of Glamorgan' ],
    'Cwm Taf': [ 'Bridgend', 'Merthyr Tydfil', 'Rhondda Cynon Taf' ],
    'Hywel Dda': [ 'Carmarthenshire', 'Ceredigion', 'Pembrokeshire' ],
    Powys: [ 'Powys' ],
    'Swansea Bay': [ 'Swansea', 'Neath Port Talbot' ]
}

const scotlandNHS = {
    'Ayrshire and Arran': [ 'East Ayrshire', 'North Ayrshire', 'South Ayrshire' ],
    Borders: [ 'Scottish Borders' ],
    'Dumfries and Galloway': [ 'Dumfries and Galloway' ],
    Fife: [ 'Fife' ],
    'Forth Valley': [ 'Clackmannanshire', 'Falkirk', 'Stirling' ],
    Grampian: [ 'Aberdeen', 'Aberdeenshire', 'Moray' ],
    'Greater Glasgow and Clyde': [
        'Glasgow',
        'East Dunbartonshire',
        'East Renfrewshire',
        'Inverclyde',
        'Renfrewshire',
        'West Dunbartonshire'
    ],
    Highland: [ 'Argyll and Bute', 'Highland' ],
    Lanarkshire: [ 'North Lanarkshire', 'South Lanarkshire' ],
    Lothian: [ 'East Lothian', 'Edinburgh', 'Midlothian', 'West Lothian' ],
    Orkney: [ 'Orkney Islands' ],
    Shetland: [ 'Shetland Islands' ],
    Tayside: [ 'Angus', 'Dundee', 'Perthshire and Kinross' ],
    'Western Isles': [ 'Eilean Siar' ]
}

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

data.forEach((line, index) => {
    if (index === 0 || line === '') return

    const lineSplit = splitCSV(line)
    const date = lineSplit[0]
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    const regionEnglish = lineSplit[1]
    const areaCode = lineSplit[2]
    let areaEnglish = lineSplit[3].replace(/"/g, '')
    areaEnglish = name_changes[areaEnglish] ? name_changes[areaEnglish] : areaEnglish
    const confirmedCount = parseInt(lineSplit[4], 10)
    if (isNaN(confirmedCount)) return
    let subAreaEnglish = null

    if (areaCode === '') return

    // data for local authority areas in Wales were reported at the beginning, later changed to head broad level
    if (regionEnglish === 'Wales' && !Object.keys(walesNHS).includes(areaEnglish)) {
        const healthboard = Object.keys(walesNHS).find((x) => walesNHS[x].includes(areaEnglish))
        if (healthboard != null) areaEnglish = healthboard
    }

    const areaIndex = Object.keys(sub_areas).findIndex((x) => sub_areas[x].includes(areaEnglish))
    if (areaIndex >= 0) {
        subAreaEnglish = areaEnglish
        areaEnglish = Object.keys(sub_areas)[areaIndex]
    }

    const region = en2zh[regionEnglish]
    const area = areaEnglish
    const subArea = subAreaEnglish

    if (regionEnglish === 'England' && subArea != null) {
        if (!(subArea in output_uk[region][area])) {
            output_uk[region][area][subArea] = {
                ENGLISH: subArea,
                confirmedCount: {},
                curedCount: {},
                deadCount: {}
            }
        }
        output_uk[region][area][subArea]['confirmedCount'][date] = confirmedCount
        if (!(date in output_uk[region][area]['confirmedCount'])) output_uk[region][area]['confirmedCount'][date] = 0
        output_uk[region][area]['confirmedCount'][date] += confirmedCount
    } else {
        if (!(area in output_uk[region])) {
            output_uk[region][area] = {
                ENGLISH: area,
                confirmedCount: {},
                curedCount: {},
                deadCount: {}
            }
        }
        if (!(date in output_uk[region][area]['confirmedCount'])) {
            output_uk[region][area]['confirmedCount'][date] = 0
        }
        output_uk[region][area]['confirmedCount'][date] += confirmedCount
    }
    if (!(date in output_uk[region]['confirmedCount'])) output_uk[region]['confirmedCount'][date] = 0
    output_uk[region]['confirmedCount'][date] += confirmedCount
})

const totalData = fs.readFileSync(`${data_folder}/${data_total_file}`, 'utf8').split(/\r?\n/)

totalData.forEach((line, index) => {
    if (index === 0 || line === '') return
    const lineSplit = splitCSV(line)
    const date = lineSplit[0]
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)
    const regionEnglish = lineSplit[1]
    const region = en2zh[regionEnglish]

    let metric = null
    if (lineSplit[2] === 'ConfirmedCases') metric = 'confirmedCount'
    if (lineSplit[2] === 'Deaths') metric = 'deadCount'
    if (metric == null) return

    const count = parseInt(lineSplit[3], 10)

    if (regionEnglish !== 'UK') {
        output_uk[region][metric][date] = count
    }
})

fs.writeFileSync(`public/data/uk.json`, JSON.stringify(output_uk))

// modify map
const mapName = 'gadm36_GBR_2'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    const regionEnglish = geo.properties.NAME_1
    const region = en2zh[regionEnglish]

    let areaEnglish = geo.properties.NAME_2

    if (regionEnglish === 'England') {
        if (areaEnglish === 'Bedfordshire') areaEnglish = 'Bedford'
        if (areaEnglish === 'Bournemouth' || areaEnglish === 'Poole')
            areaEnglish = 'Bournemouth, Christchurch and Poole'
    } else if (regionEnglish === 'Scotland') {
        const areaIndex = Object.keys(scotlandNHS).findIndex((x) => scotlandNHS[x].includes(areaEnglish))
        if (areaIndex >= 0) {
            areaEnglish = Object.keys(scotlandNHS)[areaIndex]
        }
    } else if (regionEnglish === 'Wales') {
        if (areaEnglish === 'Rhondda, Cynon, Taff') areaEnglish = 'Rhondda Cynon Taf'
        if (areaEnglish === 'Anglesey') areaEnglish = 'Isle of Anglesey'
        areaEnglish = Object.keys(walesNHS).find((x) => walesNHS[x].includes(areaEnglish))
    }

    const area = areaEnglish
    if (!(area in output_uk[region])) {
        console.log(`Cannot find data for ${areaEnglish}, ${regionEnglish}!`)
    }

    geo.properties.NAME_2 = areaEnglish
    geo.properties.CHINESE_NAME = en2zh[area] ? en2zh[area] : area
    geo.properties.COUNTRY_CHINESE_NAME = region

    if (area in output_uk[region]) {
        geo.properties.REGION = `英国.${region}.${area}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
