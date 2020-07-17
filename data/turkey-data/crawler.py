import os
import datetime
import tabula
import re
import requests
from bs4 import BeautifulSoup
from pathlib import Path

folder = 'data/turkey-data/'
data_files = os.listdir(folder)

url = 'https://sbsgm.saglik.gov.tr/TR,66559/gunluk-rapor--daily-report.html'

regions = [
    'Istanbul', 'Western Marmara', 'Aegean', 'Eastern Marmara',
    'Western Anatolia', 'Mediterranean', 'Central Anatolia',
    'Western Blacksea', 'Eastern Blacksea', 'Northeastern Anatolia',
    'Mideastern Anatolia', 'Southeastern Anatolia'
]

html_txt = requests.get(url=url).text
soup = BeautifulSoup(html_txt, 'html.parser')
report_elems = soup.find_all('a', string=re.compile('Daily Situation Report'))
for report_elem in report_elems:
    pdf_link = 'https://sbsgm.saglik.gov.tr' + report_elem['href']
    match = re.search(r'(\d{2})(\d{2})(20\d{2})', pdf_link)
    date = match.group(3) + '-' + match.group(2) + '-' + match.group(1)
    file_name = date + '.csv'

    if not file_name in data_files:
        temp_file = folder + file_name + '_tmp'
        tabula.convert_into(pdf_link,
                            temp_file,
                            output_format="csv",
                            pages=3,
                            stream=True)

        temp_f = open(temp_file, 'r')
        f = open(folder + file_name, 'w')

        lines = temp_f.readlines()
        pattern = '(' + '|'.join(regions) + ')\s(\d+)'
        for line in lines:
            match = re.search(pattern, line)
            if match is not None:
                f.write(match.group(1) + ',' + match.group(2) + '\n')

        temp_f.close()
        f.close()

# clean temp files
for p in Path(folder).glob("*.csv_tmp"):
    p.unlink()