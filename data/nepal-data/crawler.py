import requests
import json

url = 'https://bipad.gov.np/api/v1/covid19-case'
exit()

data = []

while True:
    print('fetching ' + url)
    raw_data = requests.get(url=url).json()
    data += raw_data['results']

    count = raw_data['count']
    url = raw_data['next']
    if url is None: break

if (len(data) != count):
    print('Invalid Nepal data!')
    exit(1)

data = json.dumps(
    data,
    indent=2,
    ensure_ascii=False,
)

f = open('data/nepal-data/raw.json', 'w')
f.write(data)
f.close()