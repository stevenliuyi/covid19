import requests
import json
import sys
from datetime import date, timedelta

url = 'https://services9.arcgis.com/XPDxEtZ1oS0ENZZq/arcgis/rest/services/COVID_19_Ghana/FeatureServer/1/query?where=1%3D1&returnGeometry=false&outFields=*&f=json'

today = date.today()
yesterday = today - timedelta(days=1)

data_date = yesterday.strftime('%Y-%m-%d')

data = requests.get(url=url).json()

if 'features' in data.keys():
    data = data['features']
else:
    print('Crawled Ghana data are not valid!')
    exit(1)

f = open('data/ghana-data/history/' + str(data_date) + '.txt', 'w')

for record in data:
    region = record['attributes']['REGION']
    count = record['attributes']['Number_of_Cases']
    f.write(region + ' – ' + str(count) + '\n')

f.close()