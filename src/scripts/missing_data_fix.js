// fill missing data
const fs = require('fs')

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

function fillMissingData(obj) {
    if (typeof obj !== 'object' || obj == null) return
    ;[ 'confirmedCount', 'curedCount', 'deadCount' ].forEach((metric) => {
        if (obj[metric] == null || Object.keys(obj[metric]).length === 0) return
        const firstDateString = Object.keys(obj[metric]).sort((a, b) => (parseDate(a) > parseDate(b) ? 1 : -1))[0]
        let date = parseDate(firstDateString)
        let previousDate = new Date(date.getTime())
        while (date <= currDate) {
            const dateString = date.toISOString().slice(0, 10)
            const previousDateString = previousDate.toISOString().slice(0, 10)
            if (!(dateString in obj[metric])) {
                obj[metric][dateString] = obj[metric][previousDateString]
            }
            // next day
            previousDate = new Date(date.getTime())
            date.setDate(date.getDate() + 1)
        }
    })

    Object.keys(obj)
        .filter((x) => ![ 'confirmedCount', 'curedCount', 'deadCount', 'ENGLISH' ].includes(x))
        .forEach((x) => {
            fillMissingData(obj[x])
        })
}

fillMissingData(data)

const pretty_data_file = 'public/data/all.json'
fs.writeFileSync(data_file, JSON.stringify(data))
fs.writeFileSync(pretty_data_file, JSON.stringify(data, null, 2))
