from selenium import webdriver
from selenium.webdriver.support.ui import Select
import requests
import time
import subprocess
import re

# https://tablerocovid.mspas.gob.gt/
url = 'https://gtmvigilanciacovid.shinyapps.io/3869aac0fb95d6baf2c80f19f2da5f98/'
data_folder = 'data/guatemala-data/'

regions = [
    "Alta Verapaz", "Baja Verapaz", "Chimaltenango", "Chiquimula",
    "El Progreso", "Escuintla", "Guatemala", "Huehuetenango", "Izabal",
    "Jalapa", "Jutiapa", "Peten", "Quetzaltenango", "Quiche", "Retalhuleu",
    "Sacatepequez", "San Marcos", "Santa Rosa", "Solola", "Suchitepequez",
    "Totonicapan", "Zacapa"
]

opts = webdriver.ChromeOptions()
opts.add_argument("--headless")
opts.add_experimental_option(
    "prefs", {
        "download.default_directory": "/home/seluser/Downloads",
        "download.prompt_for_download": False,
    })

driver = webdriver.Remote(command_executor='http://localhost:4444/wd/hub',
                          desired_capabilities=opts.to_capabilities())


def download_file_by_region(region, metric):
    driver.get(url)
    time.sleep(5)

    dropdown = driver.find_element_by_css_selector('.selectize-control')
    dropdown.click()
    options = dropdown.find_elements_by_css_selector('.option')
    for option in options:
        if (option.text.strip() == region.upper()):
            option.click()
            print('Found ' + region)
            break
    time.sleep(2)

    tab_name = 'Casos confirmados' if metric == 'confirmed' else 'Casos fallecidos'
    tabs = driver.find_elements_by_css_selector('span')
    for tab in tabs:
        if (tab.text.strip() == tab_name):
            tab.click()
    time.sleep(2)

    links = driver.find_elements_by_css_selector('a')
    table_link = None
    for link in links:
        if (link.text.strip() == 'Cuadro de datos'):
            table_link = link

    if table_link is None:
        print('Cannot find table link!')
        exit(1)

    table_link.click()
    time.sleep(3)

    download_link = driver.find_element_by_css_selector('.buttons-csv')
    print('Downloading ' + metric + ' data for ' + region)
    download_link.click()
    time.sleep(2)

    # copy file from container to host
    downloaded_filename = 'confirmados_fecha.csv' if metric == 'confirmed' else 'fallecidos_fecha.csv'
    command = 'docker cp selenium:/home/seluser/Downloads/' + downloaded_filename + ' ' + data_folder + metric + '/' + region.replace(' ', '_') + '.csv'
    # delete file
    command += ';docker exec selenium bash -c "rm /home/seluser/Downloads/' + downloaded_filename + '"'
    subprocess.Popen(command, shell=True)
    time.sleep(2)


for region in regions:
    download_file_by_region(region, 'confirmed')
    download_file_by_region(region, 'deaths')

driver.quit()