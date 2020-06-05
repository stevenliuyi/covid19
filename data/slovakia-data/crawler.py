import requests
import json

url = 'https://api.apify.com/v2/datasets/oUWi8ci7F2R9V5ZFy/items?format=json&clean=1'

data = requests.get(url=url).json()

data = json.dumps(
    data,
    indent=2,
    ensure_ascii=False,
)

f = open('data/slovakia-data/raw.json', 'w')
f.write(data)
f.close()