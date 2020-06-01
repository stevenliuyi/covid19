import requests
import json

url = 'https://www.koronavirus.hr/json/?action=po_danima_zupanijama'

data = requests.get(url=url).json()

data = json.dumps(
    data,
    indent=2,
    ensure_ascii=False,
)

f = open('data/croatia-data/raw.json', 'w')
f.write(data)
f.close()