import requests
import json

url = 'https://api.covid19india.org/raw_data.json'

data = requests.get(url=url).json()
data = data["raw_data"]

data = json.dumps(
    data,
    indent=2,
    ensure_ascii=False,
)

f = open('data/india-data/raw.json', 'w')
f.write(data)
f.close()