#!/bin/bash

mkdir -p ./data/maps
mkdir -p ./public/maps

# download maps
gadm_maps="CHN HKG MAC TWN KOR ITA FRA DEU JPN AUT AUS USA CAN ESP CHE GBR SWE POL NOR IRN PRT BRA MYS CHL"
for map in $gadm_maps; do
   wget -nc -q https://biogeo.ucdavis.edu/data/gadm3.6/shp/gadm36_${map}_shp.zip -O ./data/maps/gadm36_${map}_shp.zip
   unzip -q -o -d ./data/maps/ ./data/maps/gadm36_${map}_shp.zip
done

wget -nc -q https://raw.githubusercontent.com/zcreativelabs/react-simple-maps/master/topojson-maps/world-50m-simplified.json -O ./data/maps/world-50m.json
wget -nc -q https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json -O ./data/maps/states-10m.json
wget -nc -q https://raw.githubusercontent.com/deldersveld/topojson/master/countries/netherlands/nl-gemeentegrenzen-2016.json -O ./data/maps/netherlands.json
wget -nc -q https://raw.githubusercontent.com/leakyMirror/map-of-europe/master/TopoJSON/europe.topojson -O ./public/maps/europe.json

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
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_USA_2.shp -filter 'TYPE_2 != "Water body"' -simplify 0.5% -clean -o format=topojson ./public/maps/gadm36_USA_2.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_CAN_1.shp -simplify 0.3% -clean -o format=topojson ./public/maps/gadm36_CAN_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_ESP_1.shp -simplify 1% -clean -o format=topojson ./public/maps/gadm36_ESP_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_CHE_1.shp -simplify 10% -clean -o format=topojson ./public/maps/gadm36_CHE_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_GBR_2.shp -simplify 2% -clean -o format=topojson ./public/maps/gadm36_GBR_2.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_SWE_1.shp -simplify 0.5% -clean -o format=topojson ./public/maps/gadm36_SWE_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_POL_1.shp -simplify 2% -clean -o format=topojson ./public/maps/gadm36_POL_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_NOR_1.shp -simplify 1% -clean -o format=topojson ./public/maps/gadm36_NOR_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_IRN_1.shp -simplify 5% -clean -o format=topojson ./public/maps/gadm36_IRN_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_PRT_2.shp -simplify 1% -clean -o format=topojson ./public/maps/gadm36_PRT_2.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_BRA_1.shp -simplify 0.5% -clean -o format=topojson ./public/maps/gadm36_BRA_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_MYS_1.shp -simplify 2% -clean -o format=topojson ./public/maps/gadm36_MYS_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_CHL_1.shp -simplify 0.2% -clean -o format=topojson ./public/maps/gadm36_CHL_1.json

./node_modules/mapshaper/bin/mapshaper ./data/maps/world-50m.json -filter 'NAME != "Antarctica"' -simplify 50% -clean -o format=topojson ./public/maps/world-50m.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/states-10m.json -simplify 50% -clean -o format=topojson ./public/maps/states-10m.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/netherlands.json -simplify 10% -clean -o format=topojson ./public/maps/netherlands.json

# combine maps
./node_modules/mapshaper/bin/mapshaper -i ./data/maps/gadm36_CHN_1.json ./data/maps/gadm36_HKG_0.json ./data/maps/gadm36_MAC_0.json ./data/maps/gadm36_TWN_0.json combine-files -merge-layers force -o format=topojson ./public/maps/gadm36_CHN_1.json
./node_modules/mapshaper/bin/mapshaper -i ./data/maps/gadm36_CHN_2.json ./data/maps/gadm36_HKG_0.json ./data/maps/gadm36_MAC_0.json ./data/maps/gadm36_TWN_0.json combine-files -merge-layers force -o format=topojson ./public/maps/gadm36_CHN_2.json

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
data_processing_filenames="world_current world china china_overall world_dxy korea italy us us_1p3a france germany japan austria australia canada spain switzerland uk netherlands sweden poland norway iran portugal brazil malaysia chile"

for filename in $data_processing_filenames; do
    echo "Running data_processing_${filename}.js ..."
    node src/scripts/data_processing_${filename}.js
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
    node src/scripts/${filename}.js
    if [ $? != 0 ]; then
       exit 1
    fi
done