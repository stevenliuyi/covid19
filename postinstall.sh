#!/bin/bash

mkdir -p ./data/maps
mkdir -p ./public/maps

# download maps
wget -nc https://biogeo.ucdavis.edu/data/gadm3.6/shp/gadm36_CHN_shp.zip -O ./data/maps/gadm36_CHN_shp.zip
unzip -o -d ./data/maps/ ./data/maps/gadm36_CHN_shp.zip
wget -nc https://biogeo.ucdavis.edu/data/gadm3.6/shp/gadm36_HKG_shp.zip -O ./data/maps/gadm36_HKG_shp.zip
unzip -o -d ./data/maps/ ./data/maps/gadm36_HKG_shp.zip
wget -nc https://biogeo.ucdavis.edu/data/gadm3.6/shp/gadm36_MAC_shp.zip -O ./data/maps/gadm36_MAC_shp.zip
unzip -o -d ./data/maps/ ./data/maps/gadm36_MAC_shp.zip
wget -nc https://biogeo.ucdavis.edu/data/gadm3.6/shp/gadm36_TWN_shp.zip -O ./data/maps/gadm36_TWN_shp.zip
unzip -o -d ./data/maps/ ./data/maps/gadm36_TWN_shp.zip
wget -nc https://biogeo.ucdavis.edu/data/gadm3.6/shp/gadm36_KOR_shp.zip -O ./data/maps/gadm36_KOR_shp.zip
unzip -o -d ./data/maps/ ./data/maps/gadm36_KOR_shp.zip
wget -nc https://biogeo.ucdavis.edu/data/gadm3.6/shp/gadm36_ITA_shp.zip -O ./data/maps/gadm36_ITA_shp.zip
unzip -o -d ./data/maps/ ./data/maps/gadm36_ITA_shp.zip
wget -nc https://biogeo.ucdavis.edu/data/gadm3.6/shp/gadm36_FRA_shp.zip -O ./data/maps/gadm36_FRA_shp.zip
unzip -o -d ./data/maps/ ./data/maps/gadm36_FRA_shp.zip
wget -nc https://biogeo.ucdavis.edu/data/gadm3.6/shp/gadm36_DEU_shp.zip -O ./data/maps/gadm36_DEU_shp.zip
unzip -o -d ./data/maps/ ./data/maps/gadm36_DEU_shp.zip
wget -nc https://biogeo.ucdavis.edu/data/gadm3.6/shp/gadm36_JPN_shp.zip -O ./data/maps/gadm36_JPN_shp.zip
unzip -o -d ./data/maps/ ./data/maps/gadm36_JPN_shp.zip
wget -nc https://biogeo.ucdavis.edu/data/gadm3.6/shp/gadm36_AUT_shp.zip -O ./data/maps/gadm36_AUT_shp.zip
unzip -o -d ./data/maps/ ./data/maps/gadm36_AUT_shp.zip
wget -nc https://biogeo.ucdavis.edu/data/gadm3.6/shp/gadm36_AUS_shp.zip -O ./data/maps/gadm36_AUS_shp.zip
unzip -o -d ./data/maps/ ./data/maps/gadm36_AUS_shp.zip

wget -nc https://raw.githubusercontent.com/zcreativelabs/react-simple-maps/master/topojson-maps/world-50m-simplified.json -O ./data/maps/world-50m.json

wget -nc https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json -O ./data/maps/states-10m.json

# simplify maps
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_CHN_1.shp -simplify 2% -clean -o format=topojson ./data/maps/gadm36_CHN_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_CHN_2.shp -simplify 2% -clean -o format=topojson ./data/maps/gadm36_CHN_2.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_HKG_0.shp -simplify 0.2% -clean -o format=topojson ./data/maps/gadm36_HKG_0.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_MAC_0.shp -simplify 3% -clean -o format=topojson ./data/maps/gadm36_MAC_0.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_TWN_0.shp -simplify 0.5% -clean -o format=topojson ./data/maps/gadm36_TWN_0.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_KOR_1.shp -simplify 0.5% -clean -o format=topojson ./public/maps/gadm36_KOR_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_ITA_1.shp -simplify 1% -clean -o format=topojson ./public/maps/gadm36_ITA_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_FRA_1.shp -simplify 1% -clean -o format=topojson ./public/maps/gadm36_FRA_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_DEU_1.shp -simplify 1% -clean -o format=topojson ./public/maps/gadm36_DEU_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_JPN_1.shp -simplify 0.5% -clean -o format=topojson ./public/maps/gadm36_JPN_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_AUT_1.shp -simplify 5% -clean -o format=topojson ./public/maps/gadm36_AUT_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_AUS_1.shp -simplify 0.2% -clean -o format=topojson ./public/maps/gadm36_AUS_1.json

./node_modules/mapshaper/bin/mapshaper ./data/maps/world-50m.json -filter 'NAME != "Antarctica"' -simplify 50% -clean -o format=topojson ./public/maps/world-50m.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/states-10m.json -simplify 50% -clean -o format=topojson ./public/maps/states-10m.json

# combine maps
./node_modules/mapshaper/bin/mapshaper -i ./data/maps/gadm36_CHN_1.json ./data/maps/gadm36_HKG_0.json ./data/maps/gadm36_MAC_0.json ./data/maps/gadm36_TWN_0.json combine-files -merge-layers force -o format=topojson ./public/maps/gadm36_CHN_1.json
./node_modules/mapshaper/bin/mapshaper -i ./data/maps/gadm36_CHN_2.json ./data/maps/gadm36_HKG_0.json ./data/maps/gadm36_MAC_0.json ./data/maps/gadm36_TWN_0.json combine-files -merge-layers force -o format=topojson ./public/maps/gadm36_CHN_2.json

# reverse DXY data file so that the lastest record is in the end instead of beginning
tac data/dxy-data/csv/DXYArea.csv > data/DXYArea_reversed.csv

# download data files for South Korea cases
mkdir -p data/korea-data
wget --no-check-certificate 'https://docs.google.com/spreadsheets/d/1nKRkOwnGV7RgsMnsYE6l96u4xxl3ZaNiTluPKEPaWm8/export?gid=0&format=csv' -O data/korea-data/line_list.csv
#wget --no-check-certificate 'https://docs.google.com/spreadsheets/d/1nKRkOwnGV7RgsMnsYE6l96u4xxl3ZaNiTluPKEPaWm8/export?gid=898304475&format=csv' -O data/korea-data/geo_distribution.csv
wget --no-check-certificate 'https://docs.google.com/spreadsheets/d/1nKRkOwnGV7RgsMnsYE6l96u4xxl3ZaNiTluPKEPaWm8/export?gid=306770783&format=csv' -O data/korea-data/cumulative_numbers.csv

# data folder
mkdir -p public/data

# generate data in JSON format and include data in TOPOJSON maps
node src/scripts/data_processing_world.js
node src/scripts/data_processing_china.js
node src/scripts/data_processing_korea.js
node src/scripts/data_processing_italy.js
node src/scripts/data_processing_us.js
node src/scripts/data_processing_france.js
node src/scripts/data_processing_germany.js
node src/scripts/data_processing_japan.js
node src/scripts/data_processing_austria.js
node src/scripts/data_processing_australia.js

# merge data
node src/scripts/data_merge.js