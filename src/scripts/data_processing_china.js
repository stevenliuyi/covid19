const fs = require('fs')
const readline = require('readline')
const assert = require('assert')

let output_china = {}
let currentDate = null

// data from Dingxiangyuan
let lineReader = readline.createInterface({
    input: fs.createReadStream('data/DXYArea_reversed.csv')
})

// ignore comma inside double quotes when processing data
// reference: https://stackoverflow.com/a/40672956
const splitCSV = function(string) {
    var matches = string.match(/(\s*"[^"]+"\s*|\s*[^,]+|,)(?=,|$)/g)
    for (var n = 0; n < matches.length; ++n) {
        matches[n] = matches[n].trim()
        if (matches[n] === ',') matches[n] = ''
    }
    if (string[0] === ',') matches.unshift('')
    return matches
}

lineReader.on('line', function(line) {
    //const lineSplit = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
    const lineSplit = splitCSV(line)
    assert(lineSplit.length === 19, `Error occurred when processing ${line}. Output is ${lineSplit}`)
    const country = lineSplit[2]
    const province = lineSplit[4]
    const provinceEnglish = lineSplit[5]
    const city = lineSplit[12]
    const cityEnglish = lineSplit[13]
    const provinceConfirmedCount = parseInt(lineSplit[7], 10)
    const provinceCuredCount = parseInt(lineSplit[9], 10)
    const provinceDeadCount = parseInt(lineSplit[10], 10)
    const cityConfirmedCount = parseInt(lineSplit[15], 10)
    const cityCuredCount = parseInt(lineSplit[17], 10)
    const cityDeadCount = parseInt(lineSplit[18], 10)
    const date = lineSplit[11].substr(0, 10)

    if (country !== '中国' || city === '') return

    // end of file
    if (date === 'updateTime') return

    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    if (!(province in output_china))
        output_china[province] = {
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }

    // English name
    output_china[province].ENGLISH = provinceEnglish

    // copy date from previous date to new date when date is updated
    if (currentDate !== date) {
        if (currentDate != null) {
            for (const p in output_china) {
                if (output_china[p].confirmedCount != null) {
                    output_china[p].confirmedCount[date] = output_china[p].confirmedCount[currentDate]
                    output_china[p].curedCount[date] = output_china[p].curedCount[currentDate]
                    output_china[p].deadCount[date] = output_china[p].deadCount[currentDate]
                }
                for (const c in output_china[p]) {
                    if (output_china[p][c].confirmedCount != null) {
                        output_china[p][c].confirmedCount[date] = output_china[p][c].confirmedCount[currentDate]
                        output_china[p][c].curedCount[date] = output_china[p][c].curedCount[currentDate]
                        output_china[p][c].deadCount[date] = output_china[p][c].deadCount[currentDate]
                    }
                }
            }
        }
        currentDate = date
    }

    let newConfirmedCount = output_china[province].confirmedCount
    let newCuredCount = output_china[province].curedCount
    let newDeadCount = output_china[province].deadCount

    newConfirmedCount[date] = provinceConfirmedCount
    newCuredCount[date] = provinceCuredCount
    newDeadCount[date] = provinceDeadCount

    // check if the city record is already created
    let cityMatch = Object.keys(output_china[province]).filter(
        (c) => city.slice(0, 2) === c.slice(0, 2) && Math.abs(city.length - c.length) <= 2
    )[0]

    // check if it's unknown region
    if (city.startsWith('不明') || city.startsWith('待明确') || city.startsWith('未明确') || city.startsWith('未知')) return

    // create new record
    if (cityMatch == null) {
        output_china[province][city] = {
            confirmedCount: {},
            curedCount: {},
            deadCount: {}
        }
        cityMatch = city
    }

    output_china[province][cityMatch].ENGLISH = cityEnglish

    newConfirmedCount = output_china[province][cityMatch].confirmedCount
    newCuredCount = output_china[province][cityMatch].curedCount
    newDeadCount = output_china[province][cityMatch].deadCount

    newConfirmedCount[date] = cityConfirmedCount
    newCuredCount[date] = cityCuredCount
    newDeadCount[date] = cityDeadCount
})

// add data from Hong Kong, Macao, Taiwan
const combineChinaData = (geo, worldData, nameProp, chineseNameProp) => {
    geo.properties[nameProp] = geo.properties.NAME_0
    if (geo.properties.GID_0 === 'HKG') {
        // Hong Kong
        geo.properties[chineseNameProp] = '香港'
        geo.properties.REGION = '中国.香港'
    } else if (geo.properties.GID_0 === 'MAC') {
        // Macao
        geo.properties[chineseNameProp] = '澳门'
        geo.properties.REGION = '中国.澳门'
    } else if (geo.properties.GID_0 === 'TWN') {
        // Taiwan
        geo.properties[chineseNameProp] = '台湾'
        geo.properties.REGION = '中国.台湾'
    }
}

lineReader.on('close', function() {
    fs.writeFileSync(`public/data/china.json`, JSON.stringify(output_china))

    // for extracting data from Hong Kong, Macao and Taiwan
    const worldData = JSON.parse(fs.readFileSync(`public/data/world.json`))

    // modify maps
    const mapName1 = 'gadm36_CHN_1'
    const mapName2 = 'gadm36_CHN_2'
    const objectName = 'gadm36'

    // China (province level)
    let map = JSON.parse(fs.readFileSync(`public/maps/${mapName1}.json`))
    let geometries = map.objects[objectName].geometries
    geometries.forEach((geo) => {
        // Hong Kong, Macao, Taiwan
        if (geo.properties.NL_NAME_1 == null) {
            combineChinaData(geo, worldData, 'NAME_1', 'NL_NAME_1')
        } else {
            // Mainland China
            // remove names in Traditional Chinese
            let provinceName = geo.properties.NL_NAME_1.split('|').pop()
            // fix
            if (provinceName === '黑龍江省') provinceName = '黑龙江省'
            const provinceMatch = Object.keys(output_china).filter(
                (province) => province.indexOf(provinceName) === 0
            )[0]
            geo.properties.NL_NAME_1 = provinceMatch
            if (provinceMatch != null) {
                geo.properties.REGION = `中国.中国大陆.${provinceMatch}`
            } else {
                console.log(`$No data found for {province}!`)
            }
        }
    })
    map.objects[objectName].geometries = geometries
    fs.writeFileSync(`public/maps/${mapName1}.json`, JSON.stringify(map))

    // China (city level)
    map = JSON.parse(fs.readFileSync(`public/maps/${mapName2}.json`))
    geometries = map.objects[objectName].geometries
    geometries.forEach((geo) => {
        // Hong Kong, Macao, Taiwan
        if (geo.properties.NL_NAME_1 == null) {
            combineChinaData(geo, worldData, 'NAME_2', 'NL_NAME_2')
        } else {
            //Mainland China
            let provinceName = geo.properties.NL_NAME_1.split('|').pop()
            if (provinceName === '黑龍江省') provinceName = '黑龙江省'
            geo.properties.NL_NAME_1 = provinceName

            let cityName = geo.properties.NL_NAME_2.split('|')[0]
            if (cityName === '襄樊市') cityName = '襄阳市'
            if (cityName === '巢湖市') cityName = '合肥市'
            if (cityName === '莱芜市') cityName = '济南市'
            if (cityName === '重慶') cityName = '重庆'
            geo.properties.NL_NAME_2 = cityName

            const provinceMatch = Object.keys(output_china).filter(
                (province) => province.indexOf(provinceName) === 0
            )[0]
            geo.properties.NL_NAME_1 = provinceMatch

            if (provinceMatch != null) {
                const provinceData = output_china[provinceMatch]

                if ([ '北京市', '上海市', '天津市', '重庆市' ].includes(provinceMatch)) {
                    // Direct-controlled municipality
                    geo.properties.NL_NAME_2 = provinceMatch
                    geo.properties.REGION = `中国.中国大陆.${provinceMatch}`
                } else {
                    let cityMatch = Object.keys(provinceData).filter(
                        (city) => cityName.slice(0, 2) === city.slice(0, 2)
                    )
                    // TODO: manually check multiple data records with similar names
                    if (cityMatch.length > 1) console.log(`Multiple data records found for ${cityName}: ${cityMatch}`)
                    cityMatch = cityMatch[0]
                    if (cityMatch != null) {
                        geo.properties.NL_NAME_2 = cityMatch
                        geo.properties.REGION = `中国.中国大陆.${provinceMatch}.${cityMatch}`
                    }

                    // "Hainan" in the map is a region contains severval cities
                    if (cityName === '海南') {
                        geo.properties.NL_NAME_2 = provinceMatch
                        geo.properties.REGION = `中国.中国大陆.${provinceMatch}`
                    }
                    if (cityMatch == null) console.log(`No data found for ${cityName}`)
                }
            }
        }
    })
    map.objects[objectName].geometries = geometries
    fs.writeFileSync(`public/maps/${mapName2}.json`, JSON.stringify(map))
})
