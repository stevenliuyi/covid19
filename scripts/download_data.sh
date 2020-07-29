#!/bin/bash

# download data files for South Korea cases
mkdir -p data/korea-data
wget -q --no-check-certificate 'https://docs.google.com/spreadsheets/d/1nKRkOwnGV7RgsMnsYE6l96u4xxl3ZaNiTluPKEPaWm8/export?gid=898304475&format=csv' -O data/korea-data-parksw3/geo_distribution.csv
wget -q --no-check-certificate 'https://docs.google.com/spreadsheets/d/1nKRkOwnGV7RgsMnsYE6l96u4xxl3ZaNiTluPKEPaWm8/export?gid=306770783&format=csv' -O data/korea-data-parksw3/cumulative_numbers.csv

# download data file for Indonesia cases
mkdir -p data/indonesia-data
wget -q --no-check-certificate 'https://docs.google.com/spreadsheets/d/1sgiz8x71QyIVJZQguYtG9n6xBEKdM4fXuDs_d8zKOmY/export?gid=83750310&format=csv' -O data/indonesia-data/data_provinsi.csv

# download official data file for Saudi Arabia
mkdir -p data/saudi-arabia-data
wget -q 'https://datasource.kapsarc.org/explore/dataset/saudi-arabia-coronavirus-disease-covid-19-situation/download/?format=json&lang=en' -O data/saudi-arabia-data/raw.json

# download data for Finland
mkdir -p data/finland-data
wget -q "https://sampo.thl.fi/pivot/prod/fi/epirapo/covid19case/fact_epirapo_covid19case.csv?row=dateweek2020010120201231-443702L&column=hcdmunicipality2020-445222" -O data/finland-data/raw.csv

# download data for Latvia
mkdir -p data/latvia-data
wget -q "https://data.gov.lv/dati/dataset/e150cc9a-27c1-4920-a6c2-d20d10469873/resource/492931dd-0012-46d7-b415-76fe0ec7c216/download/covid_19_pa_adm_terit.csv" -O data/latvia-data/raw.csv

# download data for Ethiopia
# data source: https://covid19.qulph.com/
# https://docs.google.com/spreadsheets/d/1wFUxclZN5IZgnKXlXol2TIrWZ3UW2SLnDwQzZyRW11k
mkdir -p data/ethiopia-data
wget -q "https://docs.google.com/spreadsheets/d/e/2PACX-1vQD01UVxJ0NB9LGp0yrY42Kz___dovoEdmr3zI09WXkOIks6WCq6BiQmjN9On34E1vDQrLbPx0DFpX4/pub?gid=1141696962&output=csv" -O data/ethiopia-data/raw.csv

# download data for Ireland
# data source: https://data.gov.ie/dataset/covid19countystatisticshpscireland
mkdir -p data/ireland-data
wget -q "http://opendata-geohive.hub.arcgis.com/datasets/d9be85b30d7748b5b7c09450b8aede63_0.csv" -O data/ireland-data/raw.csv

# fix Albania data
mkdir -p data/albania-data/data/2020-07-28
cp data/albania-data-fix/2020-07-28.csv data/albania-data/data/2020-07-28/district_summary.csv

# data folder
mkdir -p public/data

# crawl data
crawlers="1p3a-data iran-data thailand-data chile-data india-data japan-data croatia-data hungary-data denmark-data slovakia-data slovenia-data hong-kong-data algeria-data morocco-data sri-lanka-data turkey-data"

for crawler in $crawlers; do
    python3 data/${crawler}/crawler.py
    if [ $? != 0 ]; then
       exit 1
    fi
done