import requests
import json

url = 'https://coronadatascraper.com/timeseries-byLocation.json'

data = requests.get(url=url).json()

data = json.dumps(
    data,
    indent=2,
    ensure_ascii=False,
)

f = open('data/cds-data/timeseries-byLocation.json', 'w')
f.write(data)
f.close()