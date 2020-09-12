import requests
import json
import sys

# more data source: https://covid.hespress.com/
exit()
url = 'https://covid.rue20.com/?id='

output = {}

for i in range(1, 13):
    html_txt = requests.get(url=url + str(i)).text
    data = html_txt.split('RegionChart')[1]
    data = data.split('data:')[1]
    data = data.split(']')[0]
    data = data.replace("x", '"x"')
    data = data.replace("y", '"y"')
    data = data.replace("'", '"')
    data = ''.join(data.split())
    data = data[:-1] + ']'

    data = json.loads(data)

    output[str(i)] = data

output = json.dumps(
    output,
    indent=2,
    ensure_ascii=False,
)

f = open('data/morocco-data/data.json', 'w')
f.write(output)
f.close()