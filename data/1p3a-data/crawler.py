import requests
import re
import json
import os


url = 'https://coronavirus.1point3acres.com'
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:50.0) Gecko/20100101 Firefox/50.0'}
    
html_txt = requests.get(url=url, headers=headers).text
data ="{}"

js_files = re.findall(r'chunks[^"]+\.js', html_txt)

for js_file in set(js_files):
    curr_html_txt = requests.get(url=url + '/_next/static/' + js_file, headers=headers).text
    if ('us-100' in curr_html_txt):
        data = curr_html_txt.split("JSON.parse('")[3]
        data = data.split("')}")[0]

data = data.encode().decode('unicode_escape')
data = json.loads(data)

# check
test = next((x for x in data if x["id"] == 'us-1'), None)
if test is None:
    print('Data crawled from 1P3A are not valid!')
    exit(1)

data = json.dumps(
    data,
    indent=2,
    ensure_ascii=False,
)

f = open('data/1p3a-data/raw.json', 'w')
f.write(data)
f.close()
