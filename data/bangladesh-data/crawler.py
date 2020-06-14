from selenium import webdriver
from selenium.webdriver.support.ui import Select
from datetime import datetime, timedelta
import time

opts = webdriver.FirefoxOptions()
opts.add_argument("--headless")

driver = webdriver.Remote(command_executor='http://localhost:4444/wd/hub',
                          desired_capabilities=opts.to_capabilities())

data_url = 'http://dashboard.dghs.gov.bd/webportal/pages/covid19.php'

f = open('data/bangladesh-data/bangladesh.csv', 'w')

regions = {
    '1': 'Dhaka',
    '2': 'Chittagong',
    '3': 'Rajshahi',
    '4': 'Rangpur',
    '5': 'Khulna',
    '6': 'Barisal',
    '7': 'Sylhet',
    '8': 'Mymensingh'
}

csv_lines = []

try:
    for regionId, regionName in regions.items():
        driver.get(data_url)
        time.sleep(5)

        divisionSelect = Select(driver.find_element_by_id('division'))
        divisionSelect.select_by_value(regionId)

        periodSelect = Select(driver.find_element_by_id('period'))
        periodSelect.select_by_value('LAST_6_MONTH')

        driver.find_element_by_name('Submit').submit()
        time.sleep(5)

        elems = driver.find_elements_by_css_selector(
            '#confirmed_case .highcharts-data-label .highcharts-text-outline')
        counts = [
            elem.get_attribute('innerHTML').strip().replace(',', '')
            for elem in elems
        ]

        firstDate = driver.find_element_by_css_selector(
            '#confirmed_case .highcharts-xaxis-labels text').text
        firstDate = datetime.strptime('2020-' + firstDate, '%Y-%B-%d')
        dates = [(firstDate + timedelta(days=i)).strftime('%Y-%m-%d')
                 for i in range(len(counts))]

        csv_lines += [
            dates[i] + ',' + regionName + ',' + counts[i]
            for i in range(len(counts))
        ]

        print('Fetched data for ' + regionName + '.')

    f.write('data,region,confirmed\n')
    f.write('\n'.join(csv_lines))
except Exception as e:
    print('Error ocurred when scraping Pakistan data!')
    print(e)

driver.quit()
f.close()