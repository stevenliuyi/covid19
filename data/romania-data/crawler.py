import requests
import re
import json
import os

url = 'https://covid19.geo-spatial.org/api/dashboard/v2/getCasesByCounty'

data = requests.get(url=url).json()
data = data["data"]["data"]
google_sheet_urls = [x["referinta"] for x in data]

header = ''
lines = []

f = open('data/romania-data/raw.csv', 'w')

for idx, sheet_url in enumerate(google_sheet_urls):
    download_url = re.sub(r'edit.*', 'export?format=csv', sheet_url)
    r = requests.get(url=download_url)
    r.encoding = 'utf-8'
    csv_file = r.text
    csv_file = [line.replace('\n', ' ') for line in csv_file.split('\r\n')]
    header = csv_file[0]
    lines += csv_file[1:]

f.write(header)
f.write('\r\n'.join(lines))
f.close()