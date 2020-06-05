import requests
from bs4 import BeautifulSoup
import re

url = 'https://en.wikipedia.org/w/api.php?action=parse&page=COVID-19_pandemic_in_Hungary&prop=text&formatversion=2&format=json'
html_txt = requests.get(url=url).json()['parse']['text']
soup = BeautifulSoup(html_txt, 'html.parser')

table = soup.find(
    text=re.compile('Infections \(cumulative\)')).find_parent('table')
rows = table.find_all('tr')

date_pattern = re.compile('\d{4}\.\d{2}\.\d{2}\.')

hungary_regions = [
    'Bács-Kiskun', 'Baranya', 'Békés', 'Borsod-Abaúj-Zemplén',
    'Csongrád-Csanád', 'Fejér', 'Győr-Moson-Sopron', 'Hajdú-Bihar', 'Heves',
    'Jász-Nagykun-Szolnok', 'Komárom-Esztergom', 'Nógrád', 'Pest', 'Somogy',
    'Szabolcs-Szatmár-Bereg', 'Tolna', 'Vas', 'Veszprém', 'Zala', 'Budapest'
]

f = open('data/hungary-data/data.csv', 'w')
f.write('Date,' + ','.join(hungary_regions) + '\n')

for row in rows:
    cells = row.find_all('td')
    if (len(cells) == 0): continue

    date = row.find('th').text.strip()
    if (date_pattern.match(date) is None): continue
    date = date.replace('.', '-')[:-1]

    counts = cells[:20]
    if (len(counts) != len(hungary_regions)): continue
    counts = [int(x.text.strip()) for x in counts]

    f.write(date)
    for count in counts:
        f.write(',' + str(count))
    f.write('\n')

f.close()