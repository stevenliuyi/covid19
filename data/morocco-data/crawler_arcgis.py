import requests
import json
import sys
from datetime import date, timedelta

# source: https://www.arcgis.com/apps/opsdashboard/index.html#/1a8e3edab77140c3999ccf6f0d4a906d

service_names = ['Villes_COVID19', 'Covid_19']

for name in service_names:
    url = 'https://services3.arcgis.com/hjUMsSJ87zgoicvl/arcgis/rest/services/' + name + '/FeatureServer/0/query?where=1%3D1&returnGeometry=false&outFields=*&f=json'

    today = date.today()
    yesterday = today - timedelta(days=1)

    data_date = yesterday.strftime('%Y-%m-%d')

    data = requests.get(url=url).json()

    data_str = json.dumps(
        data,
        indent=2,
        ensure_ascii=False,
    )
    f = open('data/morocco-data/raw/' + name + '_' + str(data_date) + '.json',
             'w')
    f.write(data_str)
    f.close()