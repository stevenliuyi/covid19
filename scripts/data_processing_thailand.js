const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/thailand-data'
const data_file = 'raw.json'

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_thailand = {
    ENGLISH: 'Thailand',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const data = JSON.parse(fs.readFileSync(`${data_folder}/${data_file}`))
data.forEach((record) => {
    const date = record.ConfirmDate.slice(0, 10)
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    const regionEnglish = record.ProvinceEn
    if (regionEnglish === 'Unknown' || regionEnglish == null) return
    const region = en2zh[regionEnglish]
    assert(region != null, `${regionEnglish} does not exist!`)
    if (region == null) console.log(regionEnglish)

    if (!(region in output_thailand)) {
        output_thailand[region] = {
            ENGLISH: regionEnglish,
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }
    }

    if (!(date in output_thailand[region]['confirmedCount'])) output_thailand[region]['confirmedCount'][date] = 0
    output_thailand[region]['confirmedCount'][date] += 1 // daily count
})

function parseDate(date) {
    const [ year, month, day ] = date.substr(0, 10).split('-')
    return new Date(year, month - 1, day)
}

// calculate cumulative counts
Object.keys(output_thailand)
    .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH' ].includes(x))
    .forEach((region) => {
        const dates = Object.keys(output_thailand[region]['confirmedCount']).sort(
            (a, b) => (parseDate(a) > parseDate(b) ? 1 : -1)
        )
        const firstDate = dates[0]
        const lastDate = dates[dates.length - 1]

        let currentDate = firstDate
        let prevDate = null
        while (parseDate(currentDate) <= parseDate(lastDate)) {
            if (currentDate !== firstDate) {
                if (!(currentDate in output_thailand[region]['confirmedCount'])) {
                    output_thailand[region]['confirmedCount'][currentDate] =
                        output_thailand[region]['confirmedCount'][prevDate]
                } else {
                    output_thailand[region]['confirmedCount'][currentDate] +=
                        output_thailand[region]['confirmedCount'][prevDate]
                }
            }

            // next day
            prevDate = currentDate
            currentDate = parseDate(currentDate)
            currentDate.setDate(currentDate.getDate() + 1)
            currentDate = currentDate.toISOString().slice(0, 10)
        }
    })

fs.writeFileSync(`public/data/thailand.json`, JSON.stringify(output_thailand))

// modify map
const mapName = 'gadm36_THA_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    if (regionEnglish === 'Bangkok Metropolis') regionEnglish = 'Bangkok'
    if (regionEnglish === 'Buri Ram') regionEnglish = 'Buriram'
    if (regionEnglish === 'Chon Buri') regionEnglish = 'Chonburi'
    if (regionEnglish === 'Lop Buri') regionEnglish = 'Lopburi'
    if (regionEnglish === 'Nong Bua Lam Phu') regionEnglish = 'Nong Bua Lamphu'
    if (regionEnglish === 'Phangnga') regionEnglish = 'Phang Nga'
    if (regionEnglish === 'Prachin Buri') regionEnglish = 'Prachinburi'
    if (regionEnglish === 'Si Sa Ket') regionEnglish = 'Sisaket'

    const region = en2zh[regionEnglish]
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_thailand) {
        geo.properties.REGION = `泰国.${region}`
    }
})
map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
