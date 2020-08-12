from selenium import webdriver
from datetime import datetime, timedelta
import requests
import time

opts = webdriver.FirefoxOptions()
opts.add_argument("--headless")

driver = webdriver.Remote(command_executor='http://localhost:4444/wd/hub',
                          desired_capabilities=opts.to_capabilities())

#url = 'https://covid.gov.pk/stats/pakistan'
#html_txt = requests.get(url=url).text
#data_url = html_txt.split('datastudio.google.com')[1]
#data_url = data_url.split('"')[0]
#data_url = 'https://datastudio.google.com' + data_url
data_url = 'https://datastudio.google.com/embed/reporting/1PLVi5amcc_R5Gh928gTE8-8r8-fLXJQF/page/R24IB'

file_name = 'data/pakistan-data/pakistan.csv'
f = open(file_name, 'r+')
csv_content = f.read()

try:
    driver.get(data_url)
    time.sleep(20)

    tables = driver.find_elements_by_css_selector('lego-table.table')
    for table in tables:
        table_text = table.text.strip().replace(',', '')
        if 'GMT' in table_text:
            # update time
            date = table_text.split('\n')[1]
            date = date.split('-')[0].strip()
            date = datetime.strptime(date, '%d %b %Y')
            date -= timedelta(days=1)
            date = date.strftime('%Y-%m-%d')
        elif table_text.startswith('AJK'):
            if (date in csv_content):
                print('Pakistan data on ' + date + ' already exist!')
            else:
                data = table_text.split('\n')
                csv_lines = []
                for i in range(0, len(data), 5):
                    region = data[i]
                    counts = [data[idx] for idx in [i + 1, i + 3, i + 4]]
                    csv_lines.append(date + ',' + region + ',' +
                                     ','.join(counts))
                f.write('\n')
                f.write('\n'.join(csv_lines))
except Exception as e:
    print('Error ocurred when scraping Pakistan data!')
    print(e)

driver.quit()
f.close()