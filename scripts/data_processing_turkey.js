const fs = require('fs')
const assert = require('assert')

function parseDate(date) {
    const [ year, month, day ] = date.substr(0, 10).split('-')
    return new Date(year, month - 1, day)
}

const data_folder = 'data/turkey-data'
let data_files = fs.readdirSync(data_folder)

data_files = data_files.filter((filename) => filename.endsWith('.csv'))
data_files.sort()

// translations
let en2zh = JSON.parse(fs.readFileSync('data/map-translations/en2zh.json'))

let output_turkey = {}
output_turkey = {
    ENGLISH: 'Turkey',
    confirmedCount: {},
    deadCount: {},
    curedCount: {}
}

data_files.forEach((data_file) => {
    let date = data_file.slice(0, 10)
    assert(!isNaN(new Date(date)), `Date ${date} is not valid!`)

    const data = fs.readFileSync(`${data_folder}/${data_file}`, 'utf8').split(/\r?\n/)
    data.forEach((line, index) => {
        if (line === '') return
        const lineSplit = line.split(',')

        const regionEnglish = lineSplit[0]
        const region = en2zh[regionEnglish]
        assert(!(region == null), `${regionEnglish} does not exist!`)

        const confirmedCount = parseInt(lineSplit[1], 10)
        assert(!isNaN(confirmedCount), `${lineSplit[1]} is not a valid count!`)

        if (!(region in output_turkey)) {
            output_turkey[region] = {
                ENGLISH: regionEnglish,
                confirmedCount: {},
                curedCount: {},
                deadCount: {}
            }
        }
        output_turkey[region]['confirmedCount'][date] = confirmedCount
    })
})

// calculate cumulative counts
Object.keys(output_turkey)
    .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH' ].includes(x))
    .forEach((region) => {
        const dates = Object.keys(output_turkey[region]['confirmedCount'])
        const firstDate = dates[0]
        const lastDate = dates[dates.length - 1]

        let currentDate = firstDate
        let prevDate = null
        while (parseDate(currentDate) <= parseDate(lastDate)) {
            if (currentDate !== firstDate) {
                if (!(currentDate in output_turkey[region]['confirmedCount'])) {
                    output_turkey[region]['confirmedCount'][currentDate] =
                        output_turkey[region]['confirmedCount'][prevDate]
                } else {
                    output_turkey[region]['confirmedCount'][currentDate] +=
                        output_turkey[region]['confirmedCount'][prevDate]
                }
            }

            // next day
            prevDate = currentDate
            currentDate = parseDate(currentDate)
            currentDate.setDate(currentDate.getDate() + 1)
            currentDate = currentDate.toISOString().slice(0, 10)
        }
    })

console.log(output_turkey)

fs.writeFileSync(`public/data/turkey.json`, JSON.stringify(output_turkey))

const regions = {
    Adana: 'Mediterranean',
    Adiyaman: 'Southeastern Anatolia',
    Afyon: 'Aegean',
    Agri: 'Northeastern Anatolia',
    Aksaray: 'Central Anatolia',
    Amasya: 'Western Blacksea',
    Ankara: 'Western Anatolia',
    Antalya: 'Mediterranean',
    Ardahan: 'Northeastern Anatolia',
    Artvin: 'Eastern Blacksea',
    Aydin: 'Aegean',
    Balikesir: 'Western Marmara',
    Bartın: 'Western Blacksea',
    Batman: 'Southeastern Anatolia',
    Bayburt: 'Northeastern Anatolia',
    Bilecik: 'Eastern Marmara',
    Bingöl: 'Mideastern Anatolia',
    Bitlis: 'Mideastern Anatolia',
    Bolu: 'Eastern Marmara',
    Burdur: 'Mediterranean',
    Bursa: 'Eastern Marmara',
    Çanakkale: 'Western Marmara',
    Çankiri: 'Western Blacksea',
    Çorum: 'Western Blacksea',
    Denizli: 'Aegean',
    Diyarbakir: 'Southeastern Anatolia',
    Düzce: 'Eastern Marmara',
    Edirne: 'Western Marmara',
    Elazığ: 'Mideastern Anatolia',
    Erzincan: 'Northeastern Anatolia',
    Erzurum: 'Northeastern Anatolia',
    Eskisehir: 'Eastern Marmara',
    Gaziantep: 'Southeastern Anatolia',
    Giresun: 'Eastern Blacksea',
    Gümüshane: 'Eastern Blacksea',
    Hakkari: 'Mideastern Anatolia',
    Hatay: 'Mediterranean',
    Iğdır: 'Northeastern Anatolia',
    Isparta: 'Mediterranean',
    Istanbul: 'Istanbul',
    Izmir: 'Aegean',
    'K. Maras': 'Mediterranean',
    Karabük: 'Western Blacksea',
    Karaman: 'Western Anatolia',
    Kars: 'Northeastern Anatolia',
    Kastamonu: 'Western Blacksea',
    Kayseri: 'Central Anatolia',
    Kilis: 'Southeastern Anatolia',
    Kinkkale: 'Central Anatolia',
    Kirklareli: 'Western Marmara',
    Kirsehir: 'Central Anatolia',
    Kocaeli: 'Eastern Marmara',
    Konya: 'Western Anatolia',
    Kütahya: 'Aegean',
    Malatya: 'Mideastern Anatolia',
    Manisa: 'Aegean',
    Mardin: 'Southeastern Anatolia',
    Mersin: 'Mediterranean',
    Mugla: 'Aegean',
    Mus: 'Mideastern Anatolia',
    Nevsehir: 'Central Anatolia',
    Nigde: 'Central Anatolia',
    Ordu: 'Eastern Blacksea',
    Osmaniye: 'Mediterranean',
    Rize: 'Eastern Blacksea',
    Sakarya: 'Eastern Marmara',
    Samsun: 'Western Blacksea',
    Sanliurfa: 'Southeastern Anatolia',
    Siirt: 'Southeastern Anatolia',
    Sinop: 'Western Blacksea',
    Sirnak: 'Southeastern Anatolia',
    Sivas: 'Central Anatolia',
    Tekirdag: 'Western Marmara',
    Tokat: 'Western Blacksea',
    Trabzon: 'Eastern Blacksea',
    Tunceli: 'Mideastern Anatolia',
    Usak: 'Aegean',
    Van: 'Mideastern Anatolia',
    Yalova: 'Eastern Marmara',
    Yozgat: 'Central Anatolia',
    Zinguldak: 'Western Blacksea'
}

// modify map
const mapName = 'gadm36_TUR_1'
let map = JSON.parse(fs.readFileSync(`data/maps/${mapName}.json`))
let geometries = map.objects[mapName].geometries

geometries.forEach((geo) => {
    const regionEnglish = regions[geo.properties.NAME_1]
    const region = en2zh[regionEnglish]
    assert(region != null, `${geo.properties.NAME_1} does not exist!`)

    geo.properties.NAME_1 = regionEnglish
    geo.properties.CHINESE_NAME = region

    if (region in output_turkey) {
        geo.properties.REGION = `土耳其.${region}`
    }
})

map.objects[mapName].geometries = geometries
fs.writeFileSync(`public/maps/${mapName}.json`, JSON.stringify(map))
//
