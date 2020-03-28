import requests
from bs4 import BeautifulSoup
import re

url = 'https://en.wikipedia.org/w/api.php?action=parse&page=Template:2019%E2%80%9320_coronavirus_pandemic_data/Chile_medical_cases&prop=text&formatversion=2&format=json'
html_txt = requests.get(url=url).json()['parse']['text']
soup = BeautifulSoup(html_txt, 'html.parser')

table = soup.find(text=re.compile('by region')).find_parent('table')
rows = table.find_all('tr')

date_pattern = re.compile('\d{4}-\d{1,2}-\d{1,2}')

chile_regions = [
    'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
    'Valparaíso', 'Santiago Metropolitan', "O'Higgins", 'Maule', 'Ñuble',
    'Biobío', 'Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'
]

f1 = open('data/chile-data/chile_confirmed.csv', 'w')
f2 = open('data/chile-data/chile_deaths.csv', 'w')
f1.write('Date,' + ','.join(chile_regions) + '\n')
f2.write('Date,' + ','.join(chile_regions) + '\n')

for row in rows:
    cells = row.find_all('td')
    if (len(cells) == 0): continue

    date = cells[0].text.strip()
    if (date_pattern.match(date) is None): continue
    date = '-'.join([x.zfill(2) for x in date.split('-')])
    f1.write(date)
    f2.write(date)

    counts = cells[1:17]
    if (len(counts) != len(chile_regions)): continue
    counts = [x.text.strip() for x in counts]
    for count in counts:
        splitted = count.split('(')
        if (len(splitted) == 1):
            confirmedCount = 0 if count == '' else int(count)
            deadCount = 0
        else:
            confirmedCount = int(splitted[0])
            deadCount = int(splitted[1][:-1])
        f1.write(',' + str(confirmedCount))
        f2.write(',' + str(deadCount))
    f1.write('\n')
    f2.write('\n')

f1.close()
f2.close()