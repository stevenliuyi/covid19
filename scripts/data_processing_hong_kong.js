const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/hong-kong-data'
const data_file = 'raw.json'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_hong_kong = {
    ENGLISH: 'Hong Kong',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const data = JSON.parse(fs.readFileSync(`${data_folder}/${data_file}`))

const regions = {
    'Island East': [ '東區尤德夫人那打素醫院', '律敦治醫院' ],
    'Island West': [ '瑪麗醫院' ],
    'Kowloon Central': [ '伊利沙伯醫院', '廣華醫院' ],
    'Kowloon East': [ '基督教聯合醫院', '將軍澳醫院' ],
    'Kowloon West': [ '瑪嘉烈醫院', '明愛醫院', '仁濟醫院', '北大嶼山醫院' ],
    'New Territories East': [ '威爾斯親王醫院', '雅麗氏何妙齡那打素醫院', '北區醫院' ],
    'New Territories West': [ '屯門醫院', '博愛醫院' ]
}

data.forEach((record) => {
    const date = record.comfirmDate.split('/').reverse().join('-')
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    const hospital = record.hospital
    if (hospital === '待定') return
    const regionEnglish = Object.keys(regions).find((x) => regions[x].includes(hospital))
    const region = en2zh[regionEnglish]
    assert(region != null, `${hospital} does not exist!`)

    if (!(region in output_hong_kong)) {
        output_hong_kong[region] = {
            ENGLISH: regionEnglish,
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }
    }

    if (!(date in output_hong_kong[region]['confirmedCount'])) output_hong_kong[region]['confirmedCount'][date] = 0
    output_hong_kong[region]['confirmedCount'][date] += 1 // daily count
})

function parseDate(date) {
    const [ year, month, day ] = date.substr(0, 10).split('-')
    return new Date(year, month - 1, day)
}

// calculate cumulative counts
Object.keys(output_hong_kong)
    .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH' ].includes(x))
    .forEach((region) => {
        const dates = Object.keys(output_hong_kong[region]['confirmedCount']).sort(
            (a, b) => (parseDate(a) > parseDate(b) ? 1 : -1)
        )
        const firstDate = dates[0]
        const lastDate = dates[dates.length - 1]

        let currentDate = firstDate
        let prevDate = null
        while (parseDate(currentDate) <= parseDate(lastDate)) {
            if (currentDate !== firstDate) {
                if (!(currentDate in output_hong_kong[region]['confirmedCount'])) {
                    output_hong_kong[region]['confirmedCount'][currentDate] =
                        output_hong_kong[region]['confirmedCount'][prevDate]
                } else {
                    output_hong_kong[region]['confirmedCount'][currentDate] +=
                        output_hong_kong[region]['confirmedCount'][prevDate]
                }
            }

            // next day
            prevDate = currentDate
            currentDate = parseDate(currentDate)
            currentDate.setDate(currentDate.getDate() + 1)
            currentDate = currentDate.toISOString().slice(0, 10)
        }
    })

fs.writeFileSync(`public/data/hong_kong.json`, JSON.stringify(output_hong_kong))

// modify map
const mapName = 'gadm36_HKG_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

const districts = {
    'Island East': [ 'Eastern', 'Wan Chai', 'Islands' ],
    'Island West': [ 'Central and Western', 'Southern' ],
    'Kowloon Central': [ 'Yau Tsim Mong', 'Wong Tai Sin', 'Kowloon City' ],
    'Kowloon East': [ 'Kwun Tong' ],
    'Kowloon West': [ 'Sham Shui Po', 'Kwai Tsing', 'Tsuen Wan' ],
    'New Territories East': [ 'Sha Tin', 'Tai Po', 'North', 'Sai Kung' ],
    'New Territories West': [ 'Tuen Mun', 'Yuen Long' ]
}

geometries.forEach((geo) => {
    const district = geo.properties.NAME_1
    const regionEnglish = Object.keys(districts).find((x) => districts[x].includes(district))
    const region = en2zh[regionEnglish]

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_hong_kong) {
        geo.properties.REGION = `中国.香港.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
