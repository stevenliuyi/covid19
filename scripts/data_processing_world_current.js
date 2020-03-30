const fetch = require('node-fetch')
const fs = require('fs')

const url =
    'https://services1.arcgis.com/0MSEUqKaxRlEPj5g/ArcGIS/rest/services/ncov_cases/FeatureServer/1/query?where=1%3D1&outFields=*&f=json'

const getData = async (url) => {
    try {
        const response = await fetch(url)
        let data = await response.json()
        data = data.features
            .map((x) => x.attributes)
            .map((x) =>
                [
                    x.Province_State ? x.Province_State.trim().replace(/,/g, '') : '',
                    x.Country_Region.trim().replace(/,/g, ''),
                    x.Confirmed,
                    x.Recovered,
                    x.Deaths
                ].join(',')
            )
            .join('\n')
        fs.writeFileSync('data/jhu_current_data.csv', data)
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}

getData(url)
