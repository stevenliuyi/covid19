#!/bin/bash

# download data files for South Korea cases
mkdir -p data/korea-data
wget -q --no-check-certificate 'https://docs.google.com/spreadsheets/d/1nKRkOwnGV7RgsMnsYE6l96u4xxl3ZaNiTluPKEPaWm8/export?gid=898304475&format=csv' -O data/korea-data/geo_distribution.csv
wget -q --no-check-certificate 'https://docs.google.com/spreadsheets/d/1nKRkOwnGV7RgsMnsYE6l96u4xxl3ZaNiTluPKEPaWm8/export?gid=306770783&format=csv' -O data/korea-data/cumulative_numbers.csv

# download data files for India cases
mkdir -p data/india-data
wget -q --no-check-certificate 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSc_2y5N0I67wDU38DjDh35IZSIS30rQf7_NYZhtYYGU1jJYT6_kDx4YpF-qw0LSlGsBYP8pqM_a1Pd/pub?output=csv' -O data/india-data/raw.csv

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

# data folder
mkdir -p public/data

# crawl data
crawlers="1p3a-data iran-data thailand-data chile-data india-data japan-data croatia-data hungary-data denmark-data slovakia-data slovenia-data hong-kong-data"

for crawler in $crawlers; do
    python3 data/${crawler}/crawler.py
    if [ $? != 0 ]; then
       exit 1
    fi
done