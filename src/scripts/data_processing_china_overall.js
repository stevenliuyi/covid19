const fs = require('fs')
const _ = require('lodash')

const china_output_file = 'public/data/china.json'

let data = JSON.parse(fs.readFileSync(china_output_file))

let output_china = {
    ENGLISH: 'China',
    confirmedCount: {},
    deadCount: {},
    curedCount: {},
    中国大陆: {
        ENGLISH: 'Mainland China',
        confirmedCount: {},
        deadCount: {},
        curedCount: {}
    }
}

function parseDate(date) {
    const [ year, month, day ] = date.substr(0, 10).split('-')
    return new Date(year, month - 1, day)
}

Object.keys(data).forEach((region) => {
    ;[ 'confirmedCount', 'curedCount', 'deadCount' ].map((metric) => {
        Object.keys(data[region][metric]).forEach((d) => {
            if (parseDate(d) < parseDate('2020-01-24')) delete data[region][metric][d]
        })
    })

    if ([ '香港', '澳门', '台湾' ].includes(region)) {
        output_china[region] = data[region]
    } else {
        output_china['中国大陆'][region] = data[region]
    }
})

// total numbers
Object.keys(output_china['中国大陆'])
    .filter((x) => ![ 'confirmedCount', 'deadCount', 'curedCount', 'ENGLISH' ].includes(x))
    .forEach((region) => {
        ;[ 'confirmedCount', 'deadCount', 'curedCount' ].forEach((metric) => {
            output_china['中国大陆'][metric] = _.mergeWith(
                output_china['中国大陆'][metric],
                output_china['中国大陆'][region][metric],
                _.add
            )
        })
    })

Object.keys(output_china)
    .filter((x) => ![ 'confirmedCount', 'deadCount', 'curedCount', 'ENGLISH' ].includes(x))
    .forEach((region) => {
        ;[ 'confirmedCount', 'deadCount', 'curedCount' ].forEach((metric) => {
            output_china[metric] = _.mergeWith(output_china[metric], output_china[region][metric], _.add)
        })
    })

fs.writeFileSync(china_output_file, JSON.stringify(output_china))
