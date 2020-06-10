import requests
import json
import sys
from datetime import date, timedelta

if (len(sys.argv) <= 1):
    print('No token provided for accessing Haiti data.')
    exit()

token = sys.argv[1]
url = 'https://www.coronahaiti.org/api/data/regions?token=' + token

today = date.today()
yesterday = today - timedelta(days=1)

data_date = yesterday.strftime('%Y-%m-%d')

data = requests.get(url=url).json()

if 'data' in data.keys():
    data = data['data']
else:
    print('Crawled Haiti data are not valid!')
    exit(1)

data = json.dumps(
    data,
    indent=2,
    ensure_ascii=False,
)

f = open('data/haiti-data/' + str(data_date) + '.json', 'w')
f.write(data)
f.close()