import requests
import json

url = 'https://covid19.th-stat.com/api/open/cases'

data = requests.get(url=url).json()
data = data["Data"]

data = json.dumps(
    data,
    indent=2,
    ensure_ascii=False,
)

f = open('data/thailand-data/raw.json', 'w')
f.write(data)
f.close()