import requests
import json

url = 'https://bipad.gov.np/api/v1/covid19-case/?limit=-1'

data = requests.get(url=url).json()
data = data['results']
print(len(data))

data = json.dumps(
    data,
    indent=2,
    ensure_ascii=False,
)

f = open('data/nepal-data/raw.json', 'w')
f.write(data)
f.close()