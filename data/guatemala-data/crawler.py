from selenium import webdriver
import requests
import time
import subprocess
import re
import pandas as pd

# https://tablerocovid.mspas.gob.gt/
url = 'https://opscovid19gt.shinyapps.io/S7T5AfMrZjJHX9XaXB6e7ZAS/'
data_folder = 'data/guatemala-data'

opts = webdriver.ChromeOptions()
opts.add_argument("--headless")
opts.add_experimental_option(
    "prefs", {
        "download.default_directory": "/home/seluser/Downloads",
        "download.prompt_for_download": False,
    })

driver = webdriver.Remote(command_executor='http://localhost:4444/wd/hub',
                          desired_capabilities=opts.to_capabilities())


def download_file_by_id(elem_id):
    confirmed = driver.find_element_by_id(elem_id)
    confirmed.click()
    print('Downloading file for ' + elem_id)
    time.sleep(3)
    # rename latest file
    subprocess.Popen('cd ' + data_folder +
                     '; ls -1t *.csv | head -1 | xargs -I{} mv {} ' + elem_id +
                     '.csv',
                     shell=True)


try:
    driver.get(url)
    time.sleep(10)

    btns = driver.find_elements_by_tag_name('span')
    for btn in btns:
        if btn.text.strip() == 'Bases de datos':
            print('Found download tab!')
            btn.find_element_by_xpath('..').click()
            break

    time.sleep(3)
    download_file_by_id('confirmadosFER')
    download_file_by_id('fallecidosFF')

except Exception as e:
    print('Error ocurred when downloading Guatemala data!')
    print(e)
    exit(1)

driver.quit()