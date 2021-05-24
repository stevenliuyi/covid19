import requests
from bs4 import BeautifulSoup
import json

url = 'https://koronavirus.hr/json/?action=po_danima_zupanijama'

headers = {'Content-Type': 'application/json'}
request_data = {
    'cmd': 'request.get',
    'url': url,
    'userAgent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36',
    'maxTimeout': 60000
}

try:
    response = requests.post(url='http://localhost:8191/v1',
                             data=json.dumps(request_data),
                             headers=headers)
    html_txt = response.json()['solution']['response']
    soup = BeautifulSoup(html_txt, 'html.parser')
    data = soup.find('pre').text

    data = json.loads(data)
except Exception as e:
    print('Error ocurred when scraping Pakistan data!')
    print(e)

with open('data/croatia-data/raw.json', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)