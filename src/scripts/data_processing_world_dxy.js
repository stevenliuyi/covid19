const fs = require('fs')
const _ = require('lodash')

const dxy_data_file = 'data/dxy-data/json/DXYArea-TimeSeries.json'
const world_file = 'public/data/world.json'
const china_file = 'public/data/china.json'

const output_world = JSON.parse(fs.readFileSync(world_file))
const dxy_data = JSON.parse(fs.readFileSync(dxy_data_file)).reverse()
const china_data = JSON.parse(fs.readFileSync(china_file))

const country_name_changes = {
    '英国（含北爱尔兰）': '英国',
    中非共和国: '中非',
    赞比亚共和国: '赞比亚',
    钻石公主号邮轮: '国际运输'
}

let output_world_dxy = {}

let missing_countries = []

dxy_data.forEach((record) => {
    if (record.countryName !== '中国') {
        let country = record.countryName
        if (country in country_name_changes) country = country_name_changes[country]

        if (!(country in output_world)) {
            if (!missing_countries.includes(country)) {
                //console.log(`Cannot find ${country}!`)
                missing_countries.push(country)
            }
        }

        // initialization
        if (!(country in output_world_dxy)) {
            output_world_dxy[country] = {
                confirmedCount: {},
                curedCount: {},
                deadCount: {}
            }
        }
        const date = new Date(record.updateTime).toISOString().slice(0, 10)
        ;[ 'confirmedCount', 'curedCount', 'deadCount' ].forEach((metric) => {
            output_world_dxy[country][metric][date] = record[metric]
        })
    }
})

function parseDate(date) {
    const [ year, month, day ] = date.substr(0, 10).split('-')
    return new Date(year, month - 1, day)
}

// JHU database doesn't provide recovered numbers any more, so use data from DXY instead
let world_without_china_curedCount = {}
Object.keys(output_world_dxy).forEach((country) => {
    Object.keys(output_world_dxy[country]['curedCount']).forEach((date) => {
        if (!(date in world_without_china_curedCount)) world_without_china_curedCount[date] = 0
        world_without_china_curedCount[date] += output_world_dxy[country]['curedCount'][date]
    })
})
const dates = Object.keys(world_without_china_curedCount).sort((a, b) => (parseDate(a) > parseDate(b) ? 1 : -1))
let world_curedCount = {}
dates.forEach((date) => {
    world_curedCount[date] = world_without_china_curedCount[date] + china_data['curedCount'][date]
})

// merge with JHU dataset
Object.keys(output_world).forEach((country) => {
    ;[ 'confirmedCount', 'curedCount', 'deadCount' ].map((metric) => {
        if (country in output_world_dxy) {
            output_world[country][metric] = _.mergeWith(
                output_world[country][metric],
                output_world_dxy[country][metric],
                (x, y) => {
                    if (isNaN(x)) return y
                    if (isNaN(y)) return x
                    return Math.max(x, y)
                }
            )
        }
    })
})

output_world['全球']['curedCount'] = world_curedCount

fs.writeFileSync(world_file, JSON.stringify(output_world))
