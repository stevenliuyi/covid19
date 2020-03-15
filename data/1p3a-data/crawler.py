import requests
import re

url = 'https://coronavirus.1point3acres.com'
html_txt = requests.get(url=url).text
js_files = re.findall(r'chunks[^"]+\.js', html_txt)

for js_file in set(js_files):
    curr_html_txt = requests.get(url=f'{url}/_next/static/' + js_file).text
    if ('us-1' in curr_html_txt):
        data = curr_html_txt.split("JSON.parse('")[3]
        data = data.split("')}")[0]

data = data.encode().decode('unicode_escape')

f = open('data/1p3a-data/raw.json', 'w')
f.write(data)
f.close()
