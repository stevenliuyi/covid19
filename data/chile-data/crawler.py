# Until 06 April 2020, this file was uploading data from wikipedia, which is not ideal,
# because the table is changing the format. Indeed, this sript was not activated in download_data.sh 
# This is the reason why the data was updating only until 27 March.
# Instead I propose to request the data from YACHAY COVID-19 Repository for Chile
# avaliable in https://github.com/YachayData/COVID-19/
# Which is automatically updating data for Chile from the local authorities website.


print('Extracting data for Chile from YACHAY DATA repository')
import pandas as pd
import requests

urlConfirmed="https://github.com/YachayData/COVID-19/raw/master/COVID19_Chile_Regiones-casos_totales.CSV"
urlDeaths="https://github.com/YachayData/COVID-19/raw/master/COVID19_Chile_Regiones-fallecidos_totales.CSV"

url="https://github.com/YachayData/COVID-19/raw/master/Consolidado_COVID19_Chile_Regiones.CSV"
df=pd.read_csv(url)

#rename column to Date
df.columns=['Date', 'id_reg', 'nombre_reg', 'casos_nuevos', 'casos_totales',
       'fallecidos_nuevos', 'fallecidos_totales', 'recuperados_nuevos',
       'recuperados_totales']



#we add fill_value=0 because we want to still have integers
dfConfirmed=df.pivot_table(index='Date', columns='nombre_reg',values='casos_nuevos', fill_value=0)
dfDeaths=df.pivot_table(index='Date', columns='nombre_reg',values='fallecidos_nuevos', fill_value=0)

'''
dfConfirmed.columns='Antofagasta', 'Araucania', 'Arica y Parinacota', 'Atacama', 'Aysen',
       'Biobio', 'Coquimbo', 'Los Lagos', 'Los Rios', 'LosLagos', 'Magallanes',
       'Maule', 'Metropolitana', 'Nuble', 'O\'Higgins', 'Tarapaca',
       'Valparaiso']
'''
#We'll add spaces and accesnt marks
columns_names=['Antofagasta', 'Araucanía', 'Arica y Parinacota', 'Atacama', 'Aysén',
       'Biobío', 'Coquimbo', 'Los Lagos', 'Los Ríos', 'Magallanes',
       'Maule', 'Santiago Metropolitan', 'Ñuble', 'O\'Higgins', 'Tarapacá',
       'Valparaíso']
dfConfirmed.columns=columns_names
dfDeaths.columns=columns_names


dfConfirmed.to_csv('data/chile-data/chile_confirmed.csv', index=True)
dfDeaths.to_csv('data/chile-data/chile_deaths.csv', index=True)
# I will leave the old code below anyway


##


# import requests
# from bs4 import BeautifulSoup
# import re

# url = 'https://en.wikipedia.org/w/api.php?action=parse&page=Template:2019%E2%80%9320_coronavirus_pandemic_data/Chile_medical_cases&prop=text&formatversion=2&format=json'
# html_txt = requests.get(url=url).json()['parse']['text']
# soup = BeautifulSoup(html_txt, 'html.parser')

# table = soup.find(text=re.compile('by region')).find_parent('table')
# rows = table.find_all('tr')

# date_pattern = re.compile('\d{4}-\d{1,2}-\d{1,2}')

# chile_regions = [
#     'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
#     'Valparaíso', 'Santiago Metropolitan', "O'Higgins", 'Maule', 'Ñuble',
#     'Biobío', 'Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'
# ]

# f1 = open('data/chile-data/chile_confirmed.csv', 'w')
# f2 = open('data/chile-data/chile_deaths.csv', 'w')
# f1.write('Date,' + ','.join(chile_regions) + '\n')
# f2.write('Date,' + ','.join(chile_regions) + '\n')

# for row in rows:
#     cells = row.find_all('td')
#     if (len(cells) == 0): continue

#     date = cells[0].text.strip()
#     if (date_pattern.match(date) is None): continue
#     date = '-'.join([x.zfill(2) for x in date.split('-')])
#     f1.write(date)
#     f2.write(date)

#     counts = cells[1:17]
#     if (len(counts) != len(chile_regions)): continue
#     counts = [x.text.strip() for x in counts]
#     for count in counts:
#         splitted = count.split('(')
#         if (len(splitted) == 1):
#             confirmedCount = 0 if count == '' else int(count)
#             deadCount = 0
#         else:
#             confirmedCount = int(splitted[0])
#             deadCount = int(splitted[1][:-1])
#         f1.write(',' + str(confirmedCount))
#         f2.write(',' + str(deadCount))
#     f1.write('\n')
#     f2.write('\n')

# f1.close()
# f2.close()