const fs = require('fs')
const assert = require('assert')

const data_folder = 'data/eu-data/dataset'
const data_file = 'covid-19-nl.csv'

// translations
// const en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_netherlands = {}
output_netherlands = {
    ENGLISH: 'Netherlands',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

const splitCSV = function(string) {
    var matches = string.match(/(\s*"[^"]+"\s*|\s*[^,]+|,)(?=,|$)/g)
    for (var n = 0; n < matches.length; ++n) {
        matches[n] = matches[n].trim()
        if (matches[n] === ',') matches[n] = ''
    }
    if (string[0] === ',') matches.unshift('')
    return matches
}

const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)

data.forEach((line, index) => {
    if (index === 0 || line === '') return
    const lineSplit = splitCSV(line)

    const regionEnglish = lineSplit[1].replace(/"/g, '').replace(/\./g, '')
    const confirmedCount = parseInt(lineSplit[2], 10)
    const deadCount = parseInt(lineSplit[5], 10)
    const date = lineSplit[8].slice(0, 10)
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    if (regionEnglish !== '') {
        const region = regionEnglish

        if (!(region in output_netherlands)) {
            output_netherlands[region] = { ENGLISH: regionEnglish, confirmedCount: {}, curedCount: {}, deadCount: {} }
        }
        if (!isNaN(confirmedCount)) output_netherlands[region]['confirmedCount'][date] = confirmedCount
        if (!isNaN(deadCount)) output_netherlands[region]['deadCount'][date] = deadCount
    }
})

fs.writeFileSync(`public/data/netherlands.json`, JSON.stringify(output_netherlands))

// modify map
const objName = 'Gemeentegrenzen'
let map = JSON.parse(fs.readFileSync(`data/maps/NLD.json`))
let geometries = map.objects[objName].geometries

geometries.forEach((geo) => {
    //const provinceEnglish = geo.properties.NAME_1
    let regionEnglish = geo.properties.GM_NAAM

    if (regionEnglish === 'S9dwest-Frysl1n') regionEnglish = 'Súdwest-Fryslân'
    if (regionEnglish === 'Leeuwarderadeel') regionEnglish = 'Leeuwarden'
    if (regionEnglish === 'Rijnwaarden') regionEnglish = 'Zevenaar'
    if (regionEnglish === 'Noordwijkerhout') regionEnglish = 'Noordwijk'
    if (regionEnglish === 'Haarlemmerliede en Spaarnwoude') regionEnglish = 'Haarlemmermeer'
    if ([ 'Marum', 'Zuidhorn', 'Leek', 'Grootegast' ].includes(regionEnglish)) regionEnglish = 'Westerkwartier'
    if ([ 'Schijndel', 'Sint-Oedenrode', 'Veghel' ].includes(regionEnglish)) regionEnglish = 'Meierijstad'
    if ([ 'Werkendam', 'Aalburg', 'Woudrichem' ].includes(regionEnglish)) regionEnglish = 'Altena'
    if ([ 'Zederik', 'Vianen', 'Leerdam' ].includes(regionEnglish)) regionEnglish = 'Vijfheerenlanden'
    if ([ 'De Marne', 'Bedum', 'Eemsmond', 'Winsum' ].includes(regionEnglish)) regionEnglish = 'Het Hogeland'
    if ([ 'Strijen', 'Binnenmaas', 'Korendijk', 'Oud-Beijerland', 'Cromstrijen' ].includes(regionEnglish))
        regionEnglish = 'Hoeksche Waard'
    if ([ 'Ferwerderadiel', 'Dongeradeel', 'Kollumerland en Nieuwkruisland' ].includes(regionEnglish))
        regionEnglish = 'Noardeast-Fryslân'
    if ([ 'Geldermalsen', 'Neerijnen', 'Lingewaal' ].includes(regionEnglish)) regionEnglish = 'West Betuwe'
    if ([ 'Hoogezand-Sappemeer', 'Slochteren', 'Menterwolde' ].includes(regionEnglish))
        regionEnglish = 'Midden-Groningen'
    if ([ 'Franekeradeel', 'het Bildt', 'Menameradiel', 'Littenseradiel' ].includes(regionEnglish))
        regionEnglish = 'Waadhoeke'
    if ([ 'Haren', 'Ten Boer' ].includes(regionEnglish)) regionEnglish = 'Groningen'
    if ([ 'Nuth', 'Onderbanken', 'Schinnen' ].includes(regionEnglish)) regionEnglish = 'Beekdaelen'
    if ([ 'Giessenlanden', 'Molenwaard' ].includes(regionEnglish)) regionEnglish = 'Molenlanden'
    if ([ 'Bellingwedde', 'Vlagtwedde' ].includes(regionEnglish)) regionEnglish = 'Westerwolde'

    const region = regionEnglish
    geo.properties.GM_NAAM = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_netherlands) {
        geo.properties.REGION = `荷兰.荷兰.${region}`
    } else {
        console.log(`No data for ${regionEnglish}!`)
    }
})

map.objects[objName].geometries = geometries
fs.writeFileSync(`public/maps/NLD.json`, JSON.stringify(map))
