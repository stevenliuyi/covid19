import requests
import json
import sys
from datetime import date, timedelta

# source: http://iedcr.gov.bd/

url = 'https://services3.arcgis.com/nIl76MjbPamkQiu8/arcgis/rest/services/corona_time_tracker_bd/FeatureServer/0/query?where=1%3D1&returnGeometry=false&outFields=*&f=json&resultRecordCount=2000&resultOffset='

offset = 0
features = []

while True:
    curr_url = url + str(offset)
    data = requests.get(url=curr_url).json()
    features += data['features']
    if (len(data['features']) == 0): break

    offset += 2000

data_str = json.dumps(
    features,
    indent=2,
    ensure_ascii=False,
)
f = open('data/bangladesh-data/time_series.json', 'w')
f.write(data_str)
f.close()