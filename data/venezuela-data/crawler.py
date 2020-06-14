import requests
import json
from datetime import date, timedelta

url = 'https://covid19.patria.org.ve/api/v1/summary'

today = date.today()
yesterday = today - timedelta(days=1)

data_date = yesterday.strftime('%Y-%m-%d')

data = requests.get(url=url).json()

if not 'Confirmed' in data.keys():
    print('Crawled Venezuela data are not valid!')
    exit(1)

data = json.dumps(
    data,
    indent=2,
    ensure_ascii=False,
)

f = open('data/venezuela-data/' + str(data_date) + '.json', 'w')
f.write(data)
f.close()