import requests
import json

url = 'https://api.n-cov.info/case'

try:
    data = requests.get(url=url).json()
    data = data["data"]

    data = json.dumps(
        data,
        indent=2,
        ensure_ascii=False,
    )

    f = open('data/hong-kong-data/raw.json', 'w')
    f.write(data)
    f.close()
except:
    print('Cannot obtain Hong Kong data!')