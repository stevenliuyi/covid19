const fs = require('fs')
const _ = require('lodash')

const data_folder = 'public/data'
const world_file = 'world.json'
const us_file = 'us.json'

const states_abbr_en = JSON.parse(fs.readFileSync('data/map-translations/us_states_abbr_en.json'))
const states_abbr_zh = JSON.parse(fs.readFileSync('data/map-translations/us_states_abbr_zh.json'))

const rawUSData = JSON.parse(fs.readFileSync(`${data_folder}/${world_file}`))['美国']

// initialization
// let output_us = {
//     ENGLISH: rawUSData.ENGLISH,
//     confirmedCount: rawUSData.confirmedCount,
//     deadCount: rawUSData.deadCount,
//     curedCount: rawUSData.curedCount
// }
//
// Object.keys(rawUSData)
//     .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH' ].includes(x))
//     .forEach((region) => {
//         const state = `${region.split('州')[0]}州`
//         const city = region.split('州')[1]
//
//         if (city == null) {
//             output_us[region] = rawUSData[region]
//             return
//         }
//
//         // skip states for now
//         if (city === '') return
//
//         const stateAbbr = rawUSData[region].ENGLISH.split(',')[1].trim().slice(0, 2)
//         // const cityEnglish = rawUSData[region].ENGLISH.split(',')[0].trim()
//
//         // stats for states
//         if (!(state in output_us)) {
//             output_us[state] = {
//                 ...rawUSData[region],
//                 ENGLISH: states_abbr_en[stateAbbr]
//             }
//         } else {
//             output_us[state]['confirmedCount'] = _.mergeWith(
//                 {},
//                 output_us[state]['confirmedCount'],
//                 rawUSData[region]['confirmedCount'],
//                 _.add
//             )
//             output_us[state]['deadCount'] = _.mergeWith(
//                 {},
//                 output_us[state]['deadCount'],
//                 rawUSData[region]['deadCount'],
//                 _.add
//             )
//             output_us[state]['curedCount'] = _.mergeWith(
//                 {},
//                 output_us[state]['curedCount'],
//                 rawUSData[region]['curedCount'],
//                 _.add
//             )
//         }
//
//         // stats for cities/counties
//         // output_us[state][city] = {
//         //     ...rawUSData[region],
//         //     ENGLISH: cityEnglish
//         // }
//     })
//
// // use state stats from original database when it's available
// Object.keys(rawUSData)
//     .filter((x) => ![ 'confirmedCount', 'deadCount', 'curedCount', 'ENGLISH' ].includes(x))
//     .forEach((state) => {
//         if (!(state in output_us)) {
//             output_us[state] = rawUSData[state]
//             return
//         }
//
//         output_us[state]['confirmedCount'] = _.mergeWith(
//             output_us[state]['confirmedCount'],
//             rawUSData[state]['confirmedCount'],
//             (x, y) => Math.max(x, y)
//         )
//         output_us[state]['deadCount'] = _.mergeWith(
//             output_us[state]['deadCount'],
//             rawUSData[state]['deadCount'],
//             (x, y) => Math.max(x, y)
//         )
//         output_us[state]['curedCount'] = _.mergeWith(
//             output_us[state]['curedCount'],
//             rawUSData[state]['curedCount'],
//             (x, y) => Math.max(x, y)
//         )
//     })
// ;[ 'confirmedCount', 'deadCount', 'curedCount' ].forEach((metric) => {
//     output_us[metric] = _.mergeWith(
//         {},
//         ...Object.keys(output_us)
//             .filter((x) => ![ 'confirmedCount', 'deadCount', 'curedCount', 'ENGLISH' ].includes(x))
//             .map((x) => output_us[x][metric]),
//         _.add
//     )
// })

const output_us = rawUSData
fs.writeFileSync(`${data_folder}/${us_file}`, JSON.stringify(output_us))

// modify map
let map = JSON.parse(fs.readFileSync('public/maps/states-10m.json'))
let objectName = 'states'
let geometries = map.objects[objectName].geometries

geometries.forEach((geo) => {
    let stateEnglish = geo.properties.name
    if (stateEnglish === 'District of Columbia') stateEnglish = 'Washington, D.C.'
    const stateAbbr = Object.keys(states_abbr_en).find((x) => states_abbr_en[x] === stateEnglish)
    const state = states_abbr_zh[stateAbbr]

    geo.properties.CHINESE_NAME = state
    geo.properties.NAME = stateEnglish
    if (output_us[state]) geo.properties.REGION = `美国.${state}`
})

map.objects[objectName].geometries = geometries
fs.writeFileSync(`public/maps/states-10m.json`, JSON.stringify(map))
