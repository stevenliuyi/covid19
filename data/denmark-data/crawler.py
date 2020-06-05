import requests
from bs4 import BeautifulSoup
import re
import os
import urllib.request
import zipfile
import csv

folder = 'data/denmark-data'

url = 'https://www.ssi.dk/sygdomme-beredskab-og-forskning/sygdomsovervaagning/c/covid19-overvaagning/arkiv-med-overvaagningsdata-for-covid19'
html_txt = requests.get(url=url).text
soup = BeautifulSoup(html_txt, 'html.parser')
data = soup.find_all('a',
                     href=re.compile('Data-Epidemiologisk', re.IGNORECASE))

denmark_regions = [
    'Hovedstaden', 'Sjælland', 'Syddanmark', 'Midtjylland', 'Nordjylland'
]

for d in data:
    link = d['href']
    date_match = re.search('\d{8}', link)
    if date_match is None: continue
    date = date_match[0]
    date = date[4:] + '-' + date[2:4] + '-' + date[:2]
    file_path = folder + '/' + date + '.csv'
    zip_file_path = folder + '/' + date + '.zip'

    if os.path.isfile(file_path):
        print(file_path + ' already exists')
    else:
        urllib.request.urlretrieve(link, zip_file_path)
        with zipfile.ZipFile(zip_file_path, "r") as zip_ref:
            zip_ref.extractall(folder)
            region_file_path = folder + '/Region_summary.csv'
            if os.path.isfile(region_file_path):
                os.rename(region_file_path, file_path)
            else:
                print('Region_summary.csv does not exist for ' + link)

f1 = open(folder + '/confirmed.csv', 'w')
f2 = open(folder + '/deaths.csv', 'w')
f1.write('Date,' + ','.join(denmark_regions) + '\n')
f2.write('Date,' + ','.join(denmark_regions) + '\n')

files = os.listdir(folder)
files.sort()

for file_name in files:
    if file_name.startswith('20') and file_name.endswith('.csv'):
        date = re.search('\d{4}-\d{2}-\d{2}', file_name)[0]
        with open(folder + '/' + file_name) as csv_file:
            csv_reader = csv.reader(csv_file, delimiter=';')
            confirmedCounts = [0, 0, 0, 0, 0]
            deadCounts = [0, 0, 0, 0, 0]
            for row in csv_reader:
                region = row[0].strip()
                if region in denmark_regions:
                    idx = denmark_regions.index(region)
                    confirmedCount = row[2]
                    deadCount = row[4]
                    confirmedCount = confirmedCount.replace('.', '').strip()
                    deadCount = deadCount.replace('.', '').strip()
                    confirmedCounts[idx] = confirmedCount
                    deadCounts[idx] = deadCount
            f1.write(date + ',' + ','.join(confirmedCounts) + '\n')
            f2.write(date + ',' + ','.join(deadCounts) + '\n')

f1.close()
f2.close()