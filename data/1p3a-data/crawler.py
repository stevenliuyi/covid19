import requests
import re
import json
import os

url = 'https://coronavirus.1point3acres.com'
headers = {
    'User-Agent':
    'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:50.0) Gecko/20100101 Firefox/50.0'
}

html_txt = requests.get(url=url, headers=headers).text
confirmed_data = "{}"
deaths_data = "{}"

js_files = re.findall(r'chunks[^"]+\.js', html_txt)

for js_file in set(js_files):
    curr_html_txt = requests.get(url=url + '/_next/static/' + js_file,
                                 headers=headers).text
    txt_splitted = curr_html_txt.split("JSON.parse('")
    for txt in txt_splitted:
        data = txt.split("')}")[0]
        if ('"state_name":["AK"],"county":["Anchorage"]' in data):
            confirmed_data = data
        if ('"die_count"' in data and '"confirmed_date":"2/28"' in data):
            deaths_data = data

confirmed_data = confirmed_data.encode().decode('unicode_escape')
confirmed_data = json.loads(confirmed_data)

deaths_data = deaths_data.encode().decode('unicode_escape')
deaths_data = json.loads(deaths_data)

# check
test = next((x for x in confirmed_data if isinstance(x["4/3"], int)), None)
if test is None:
    print('Data crawled from 1P3A are not valid!')
    exit(1)

test = next((x for x in deaths_data if x["confirmed_date"] == '2/28'), None)
if test is None:
    print('Data crawled from 1P3A are not valid!')
    exit(1)

confirmed_data = json.dumps(
    confirmed_data,
    indent=2,
    ensure_ascii=False,
)

deaths_data = json.dumps(
    deaths_data,
    indent=2,
    ensure_ascii=False,
)

f = open('data/1p3a-data/confirmed.json', 'w')
f.write(confirmed_data)
f.close()

f = open('data/1p3a-data/deaths.json', 'w')
f.write(deaths_data)
f.close()
