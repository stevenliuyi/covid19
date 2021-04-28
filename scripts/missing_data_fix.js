// fill missing data
const fs = require('fs')
const assert = require('assert')

const data_file = 'public/data/all_minified.json'
let data = JSON.parse(fs.readFileSync(data_file))

function parseDate(date) {
    const [ year, month, day ] = date.substr(0, 10).split('-')
    return new Date(year, month - 1, day)
}

let currDate = new Date()
currDate.setHours(currDate.getHours() - 7)
currDate = currDate.toISOString().slice(0, 10)
currDate = parseDate(currDate)

function fillMissingData(obj, ignore_leading_zeros = true) {
    if (typeof obj !== 'object' || obj == null) return
    ;[ 'confirmedCount', 'curedCount', 'deadCount' ].forEach((metric) => {
        if (obj[metric] == null) obj[metric] = {}
        if (Object.keys(obj[metric]).length === 0) return

        const firstDateString = Object.keys(obj[metric]).sort((a, b) => (parseDate(a) > parseDate(b) ? 1 : -1))[0]
        let date = parseDate(firstDateString)
        let previousDate = new Date(date.getTime())

        // use a new object so that the date keys are sorted
        let newMetricObj = {}

        let firstCaseOccurs = false
        while (date <= currDate) {
            const dateString = date.toISOString().slice(0, 10)
            const previousDateString = previousDate.toISOString().slice(0, 10)

            const count = obj[metric][dateString]

            if (isNaN(count) || count == null) {
                //console.log(`Warning! ${obj.ENGLISH} was skiped becase ${count} in ${metric} is not a valid count.`)
                delete obj[metric][dateString]
                // return
            }

            // assert(!isNaN(count) && count != null, `${count} is not a valid count (${obj.ENGLISH})!`)

            if (!(dateString in obj[metric])) {
                obj[metric][dateString] = obj[metric][previousDateString]
            }

            if (count > 0) firstCaseOccurs = true
            if (firstCaseOccurs || !ignore_leading_zeros) newMetricObj[dateString] = obj[metric][dateString]

            // next day
            previousDate = new Date(date.getTime())
            date.setDate(date.getDate() + 1)
        }

        obj[metric] = newMetricObj
    })

    Object.keys(obj)
        .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH' ].includes(x))
        .forEach((x) => {
            fillMissingData(obj[x], ignore_leading_zeros)
        })
}

// filter data by year to reduce individual file size
function filter_year(obj, year) {
    if (typeof obj !== 'object' || obj == null) return
    ;[ 'confirmedCount', 'curedCount', 'deadCount' ].forEach((metric) => {
        if (obj[metric] == null) obj[metric] = {}
        if (Object.keys(obj[metric]).length === 0) return

        obj[metric] = Object.keys(obj[metric]).filter((d) => d.startsWith(year.toString())).reduce((newObj, d) => {
            return {
                ...newObj,
                [d]: obj[metric][d]
            }
        }, {})
    })
    Object.keys(obj)
        .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH' ].includes(x))
        .forEach((x) => {
            filter_year(obj[x], year)
        })
}

// deep copy object
function clone(a) {
    return JSON.parse(JSON.stringify(a))
}

fillMissingData(data, false) // keep zero counts

// save data files by year
curr_year = new Date().getFullYear()
year = 2020
while (year <= curr_year) {
    data_cloned = clone(data)
    filter_year(data_cloned, year)
    console.log(Object.keys(data_cloned['爱尔兰']['韦克斯福德郡']['confirmedCount']).length)

    const pretty_data_file = `public/data/all_${year}.json`
    fs.writeFileSync(pretty_data_file, JSON.stringify(data_cloned, null, 2))

    year += 1
}

fillMissingData(data) // remove zero counts
fs.writeFileSync(data_file, JSON.stringify(data))
