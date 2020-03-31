#!/bin/bash

# reverse DXY data file so that the lastest record is in the end instead of beginning
tac data/dxy-data/csv/DXYArea.csv > data/DXYArea_reversed.csv

# download data files for South Korea cases
mkdir -p data/korea-data
wget -q --no-check-certificate 'https://docs.google.com/spreadsheets/d/1nKRkOwnGV7RgsMnsYE6l96u4xxl3ZaNiTluPKEPaWm8/export?gid=898304475&format=csv' -O data/korea-data/geo_distribution.csv
wget -q --no-check-certificate 'https://docs.google.com/spreadsheets/d/1nKRkOwnGV7RgsMnsYE6l96u4xxl3ZaNiTluPKEPaWm8/export?gid=306770783&format=csv' -O data/korea-data/cumulative_numbers.csv

# data folder
mkdir -p public/data

# crawl data
crawlers="1p3a-data iran-data"

for crawler in $crawlers; do
    python3 data/${crawler}/crawler.py
    if [ $? != 0 ]; then
       exit 1
    fi
done

# generate data in JSON format and include data in TOPOJSON maps
data_processing_filenames="world_current world china china_overall world_dxy korea italy us us_1p3a france germany japan austria australia canada spain switzerland uk netherlands sweden poland norway iran portugal brazil malaysia chile belgium czechia russia"

for filename in $data_processing_filenames; do
    echo "Running data_processing_${filename}.js ..."
    node scripts/data_processing_${filename}.js
    if [ $? != 0 ]; then
       exit 1
    fi
done

./node_modules/mapshaper/bin/mapshaper ./public/maps/gadm36_NOR_1.json -dissolve NAME_1 copy-fields=CHINESE_NAME,REGION -o format=topojson ./public/maps/gadm36_NOR_1.json
./node_modules/mapshaper/bin/mapshaper ./public/maps/gadm36_GBR_2.json -dissolve NAME_2 copy-fields=CHINESE_NAME,COUNTRY_CHINESE_NAME,REGION -o format=topojson ./public/maps/gadm36_GBR_2.json
./node_modules/mapshaper/bin/mapshaper ./public/maps/gadm36_USA_2.json -dissolve NAME_1,NAME_2 copy-fields=CHINESE_NAME,STATE_CHINESE_NAME,REGION -o format=topojson ./public/maps/gadm36_USA_2.json
./node_modules/mapshaper/bin/mapshaper ./public/maps/netherlands.json -dissolve GM_NAAM copy-fields=CHINESE_NAME,REGION -o format=topojson ./public/maps/netherlands.json
./node_modules/mapshaper/bin/mapshaper ./public/maps/gadm36_PRT_2.json -dissolve NAME_1 copy-fields=CHINESE_NAME,REGION -o format=topojson ./public/maps/gadm36_PRT_2.json

script_filenames="data_merge missing_data_fix"

for filename in $script_filenames; do
    echo "Running ${filename}.js ..."
    node scripts/${filename}.js
    if [ $? != 0 ]; then
       exit 1
    fi
done