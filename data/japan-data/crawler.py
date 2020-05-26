import requests
import csv

url = 'https://www.stopcovid19.jp/data/covid19japan-all.csv'

data = requests.get(url=url).text.splitlines()
reader = csv.reader(data)
for i, row in enumerate(reader):
    if i == 0: continue
    curr_url = row[5]
    curr_date = row[0]
    curr_csv = requests.get(url=curr_url).text
    curr_file = open('data/japan-data/' + row[0] + '.csv', 'w')
    curr_file.write(curr_csv)
    curr_file.close()