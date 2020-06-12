import requests
import json

url = 'https://api.corona-dz.live/province/all'

data = requests.get(url=url).json()

data = json.dumps(
    data,
    indent=2,
    ensure_ascii=False,
)

f = open('data/algeria-data/raw.json', 'w')
f.write(data)
f.close()