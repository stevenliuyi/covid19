const fs = require('fs')
const assert = require('assert')

function parseDate(date) {
    const [ year, month, day ] = date.substr(0, 10).split('-')
    return new Date(year, month - 1, day)
}

const data_folder = 'data/latin-america-data/latam_covid_19_data/daily_reports'
let data_files = fs.readdirSync(data_folder)

data_files = data_files.filter((filename) => filename.endsWith('.csv') && filename.length === 14)

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

const countries = [ 'Argentina', 'Ecuador', 'Mexico', 'Peru', 'Colombia', 'Chile' ]

// intialization
let output = {}

countries.forEach((x) => {
    output[en2zh[x]] = {
        ENGLISH: x,
        confirmedCount: {},
        deadCount: {},
        curedCount: {}
    }
})

const name_changes = {
    Mexico: 'México',
    'Zamora Chinchipe': 'Zamora-Chinchipe',
    'Ciudad Autonoma de Buenos Aires': 'Ciudad de Buenos Aires',
    'Madre de dios': 'Madre de Dios',
    Araucania: 'Araucanía',
    Aysen: 'Aysén',
    Biobio: 'Biobío',
    Nuble: 'Ñuble',
    Santiago: 'Santiago Metropolitan',
    Tarapaca: 'Tarapacá',
    Valparaiso: 'Valparaíso',
    'Los Rios': 'Los Ríos'
}

data_files.forEach((data_file) => {
    const date = data_file.slice(0, 10)
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)
    data.forEach((line, index) => {
        if (index === 0 || line === '') return
        const lineSplit = line.split(',')
        let regionEnglish = lineSplit[2]
        if (regionEnglish in name_changes) regionEnglish = name_changes[regionEnglish]

        const countryEnglish = lineSplit[1]
        const updateTime = lineSplit[3]
        const confirmedCount = parseInt(lineSplit[4], 10)
        const deadCount = parseInt(lineSplit[5], 10)
        const curedCount = parseInt(lineSplit[6], 10)

        if (!countries.includes(countryEnglish) || updateTime === '') return

        let region = en2zh[regionEnglish]
        if (countryEnglish === 'Colombia' && regionEnglish === 'Amazonas') region = '亚马孙省'
        if (countryEnglish === 'Colombia' && regionEnglish === 'Sucre') region = '苏克雷省'
        if (countryEnglish === 'Peru' && regionEnglish === 'Amazonas') region = '亚马孙大区'

        const country = en2zh[countryEnglish]
        assert(region != null, `${regionEnglish} does not exist!`)

        if (!(region in output[country])) {
            output[country][region] = {
                ENGLISH: regionEnglish,
                confirmedCount: {},
                deadCount: {},
                curedCount: {}
            }
        }

        if (!isNaN(confirmedCount)) output[country][region]['confirmedCount'][date] = confirmedCount
        if (!isNaN(deadCount)) output[country][region]['deadCount'][date] = deadCount
        if (!isNaN(curedCount) && countryEnglish !== 'Chile') output[country][region]['curedCount'][date] = curedCount
    })
})

fs.writeFileSync(`public/data/latin_america.json`, JSON.stringify(output))

// modify map
// Mexico
let mapName = 'gadm36_MEX_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    if (regionEnglish === 'Michoacán') regionEnglish = 'Michoacan'
    if (regionEnglish === 'Nuevo León') regionEnglish = 'Nuevo Leon'
    if (regionEnglish === 'Querétaro') regionEnglish = 'Queretaro'
    if (regionEnglish === 'San Luis Potosí') regionEnglish = 'San Luis Potosi'
    if (regionEnglish === 'Yucatán') regionEnglish = 'Yucatan'
    if (regionEnglish === 'Distrito Federal') regionEnglish = 'Ciudad de Mexico'

    const region = en2zh[regionEnglish]
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)
    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output['墨西哥']) {
        geo.properties.REGION = `墨西哥.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))

// Ecuador
mapName = 'gadm36_ECU_1'
map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    if (regionEnglish === 'Cañar') regionEnglish = 'Canar'
    if (regionEnglish === 'Galápagos') regionEnglish = 'Galapagos'
    if (regionEnglish === 'Zamora Chinchipe') regionEnglish = 'Zamora-Chinchipe'

    const region = en2zh[regionEnglish]
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)
    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output['厄瓜多尔']) {
        geo.properties.REGION = `厄瓜多尔.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))

// Argentina
mapName = 'gadm36_ARG_1'
map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    if (regionEnglish === 'Córdoba') regionEnglish = 'Cordoba'
    if (regionEnglish === 'Entre Ríos') regionEnglish = 'Entre Rios'
    if (regionEnglish === 'Neuquén') regionEnglish = 'Neuquen'
    if (regionEnglish === 'Río Negro') regionEnglish = 'Rio Negro'
    if (regionEnglish === 'Tucumán') regionEnglish = 'Tucuman'

    const region = en2zh[regionEnglish]
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)
    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output['阿根廷']) {
        geo.properties.REGION = `阿根廷.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))

// Peru
mapName = 'gadm36_PER_1'
map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    if (regionEnglish === 'Apurímac') regionEnglish = 'Apurimac'
    if (regionEnglish === 'Huánuco') regionEnglish = 'Huanuco'
    if (regionEnglish === 'Junín') regionEnglish = 'Junin'
    if (regionEnglish === 'Lima Province') regionEnglish = 'Lima'
    if (regionEnglish === 'San Martín') regionEnglish = 'San Martin'

    const region = en2zh[regionEnglish]
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)
    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output['秘鲁']) {
        geo.properties.REGION = `秘鲁.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))

// Colombia
mapName = 'gadm36_COL_1'
map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    regionEnglish = regionEnglish.replace(/á/g, 'a')
    regionEnglish = regionEnglish.replace(/í/g, 'i')
    regionEnglish = regionEnglish.replace(/ó/g, 'o')
    regionEnglish = regionEnglish.replace(/ñ/g, 'n')
    regionEnglish = regionEnglish.replace(/é/g, 'e')

    const region = en2zh[regionEnglish]
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)
    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output['哥伦比亚']) {
        geo.properties.REGION = `哥伦比亚.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))

// Chile
mapName = 'gadm36_CHL_1'
map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    let regionEnglish = geo.properties.NAME_1
    if (regionEnglish === 'Aisén del General Carlos Ibáñez del Campo') regionEnglish = 'Aysén'
    if (regionEnglish === 'Bío-Bío') regionEnglish = 'Biobío'
    if (regionEnglish === "Libertador General Bernardo O'Higgins") regionEnglish = "O'Higgins"
    if (regionEnglish === 'Magallanes y Antártica Chilena') regionEnglish = 'Magallanes'
    if (regionEnglish === 'Región Metropolitana de Santiago') regionEnglish = 'Santiago Metropolitan'

    const region = en2zh[regionEnglish]
    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region
    assert(region != null, `${regionEnglish} does not exist!`)

    if (region in output['智利']) {
        geo.properties.REGION = `智利.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
