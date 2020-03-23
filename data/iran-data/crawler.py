import requests
from bs4 import BeautifulSoup
import re

url = 'https://en.wikipedia.org/w/api.php?action=parse&page=Template:2019%E2%80%9320_coronavirus_pandemic_data/Iran_medical_cases&prop=text&formatversion=2&format=json'
html_txt = requests.get(url=url).json()['parse']['text']
soup = BeautifulSoup(html_txt, 'html.parser')

table = soup.find(text=re.compile('by province')).find_parent('table')
rows = table.find_all('tr')

date_pattern = re.compile('\d{4}/\d{2}/\d{2}')

iran_provinces = [
    'Qom', 'Tehran', 'Mazandaran', 'Alborz', 'Semnan', 'Golestan', 'Qazvin',
    'Isfahan', 'Fars', 'Hormozgan', 'Kohgiluyeh and Boyer-Ahmad',
    'Chaharmahal and Bakhtiari', 'Bushehr', 'Gilan', 'Ardabil',
    'East Azerbaijan', 'West Azerbaijan', 'Kordestan', 'Zanjan', 'Markazi',
    'Hamadan', 'Khuzestan', 'Kermanshah', 'Lorestan', 'Ilam',
    'Razavi Khorasan', 'Sistan and Baluchestan', 'Yazd', 'South Khorasan',
    'Kerman', 'North Khorasan'
]

f = open('data/iran-data/iran.csv', 'w')
f.write('Date,' + ','.join(iran_provinces) + '\n')

for row in rows:
    cells = row.find_all('td')
    if (len(cells) == 0): continue

    date = cells[0].text.strip()
    if (date_pattern.match(date) is None and date != 'Total'): continue
    date = date.replace('/', '-')

    counts = cells[1:32]
    if (len(counts) != len(iran_provinces)): continue
    counts = [x.text.strip() for x in counts]
    counts = [0 if x == '' else int(x) for x in counts]
    counts = [str(x) for x in counts]
    f.write(date + ',' + ','.join(counts) + '\n')

f.close()