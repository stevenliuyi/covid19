#!/bin/bash

mkdir -p ./data/maps
mkdir -p ./public/maps

# download maps
gadm_maps="CHN HKG MAC TWN KOR ITA FRA DEU JPN AUT AUS USA CAN ESP CHE GBR SWE POL NOR IRN PRT BRA MYS CHL BEL CZE RUS MEX ECU ARG PER"
for map in $gadm_maps; do
   wget -nc -q https://biogeo.ucdavis.edu/data/gadm3.6/shp/gadm36_${map}_shp.zip -O ./data/maps/gadm36_${map}_shp.zip
   unzip -q -o -d ./data/maps/ ./data/maps/gadm36_${map}_shp.zip
done

wget -nc -q https://raw.githubusercontent.com/zcreativelabs/react-simple-maps/master/topojson-maps/world-50m-simplified.json -O ./data/maps/world-50m.json
wget -nc -q https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json -O ./data/maps/states-10m.json
wget -nc -q https://raw.githubusercontent.com/deldersveld/topojson/master/countries/netherlands/nl-gemeentegrenzen-2016.json -O ./data/maps/netherlands.json
wget -nc -q https://raw.githubusercontent.com/leakyMirror/map-of-europe/master/TopoJSON/europe.topojson -O ./data/maps/europe.json
wget -nc -q https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_provinces.geojson -O ./data/maps/italy_provinces.json
wget -nc -q https://raw.githubusercontent.com/covid19india/covid19india-react/master/public/maps/india.json -O ./data/maps/india.json

# simplify maps
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_CHN_1.shp -simplify 2% -clean -o format=topojson ./data/maps/gadm36_CHN_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_CHN_2.shp -simplify 2% -clean -o format=topojson ./data/maps/gadm36_CHN_2.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_HKG_0.shp -simplify 0.2% -clean -o format=topojson ./data/maps/gadm36_HKG_0.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_MAC_0.shp -simplify 3% -clean -o format=topojson ./data/maps/gadm36_MAC_0.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_TWN_0.shp -simplify 0.5% -clean -o format=topojson ./data/maps/gadm36_TWN_0.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_KOR_1.shp -simplify 0.5% -clean -o format=topojson ./data/maps/gadm36_KOR_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_ITA_1.shp -simplify 1% -clean -o format=topojson ./data/maps/gadm36_ITA_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_FRA_1.shp -simplify 1% -clean -o format=topojson ./data/maps/gadm36_FRA_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_DEU_1.shp -simplify 1% -clean -o format=topojson ./data/maps/gadm36_DEU_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_JPN_1.shp -simplify 0.5% -clean -o format=topojson ./data/maps/gadm36_JPN_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_AUT_1.shp -simplify 5% -clean -o format=topojson ./data/maps/gadm36_AUT_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_AUS_1.shp -simplify 0.2% -clean -o format=topojson ./data/maps/gadm36_AUS_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_USA_2.shp -filter 'TYPE_2 != "Water body"' -simplify 0.5% -clean -o format=topojson ./data/maps/gadm36_USA_2.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_CAN_1.shp -simplify 0.3% -clean -o format=topojson ./data/maps/gadm36_CAN_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_ESP_1.shp -simplify 1% -clean -o format=topojson ./data/maps/gadm36_ESP_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_CHE_1.shp -simplify 10% -clean -o format=topojson ./data/maps/gadm36_CHE_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_GBR_2.shp -simplify 2% -clean -o format=topojson ./data/maps/gadm36_GBR_2.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_SWE_1.shp -simplify 0.5% -clean -o format=topojson ./data/maps/gadm36_SWE_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_POL_1.shp -simplify 2% -clean -o format=topojson ./data/maps/gadm36_POL_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_NOR_1.shp -simplify 1% -clean -o format=topojson ./data/maps/gadm36_NOR_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_IRN_1.shp -simplify 5% -clean -o format=topojson ./data/maps/gadm36_IRN_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_PRT_2.shp -simplify 1% -clean -o format=topojson ./data/maps/gadm36_PRT_2.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_BRA_1.shp -simplify 0.5% -clean -o format=topojson ./data/maps/gadm36_BRA_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_MYS_1.shp -simplify 2% -clean -o format=topojson ./data/maps/gadm36_MYS_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_CHL_1.shp -simplify 0.2% -clean -o format=topojson ./data/maps/gadm36_CHL_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_BEL_1.shp -simplify 20% -clean -o format=topojson ./data/maps/gadm36_BEL_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_CZE_1.shp -simplify 10% -clean -o format=topojson ./data/maps/gadm36_CZE_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_RUS_1.shp -simplify 0.5% -clean -o format=topojson ./data/maps/gadm36_RUS_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_MEX_1.shp -simplify 0.5% -clean -o format=topojson ./data/maps/gadm36_MEX_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_ECU_1.shp -simplify 1% -clean -o format=topojson ./data/maps/gadm36_ECU_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_ARG_1.shp -simplify 1% -clean -o format=topojson ./data/maps/gadm36_ARG_1.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/gadm36_PER_1.shp -simplify 1% -clean -o format=topojson ./data/maps/gadm36_PER_1.json

./node_modules/mapshaper/bin/mapshaper ./data/maps/world-50m.json -filter 'NAME != "Antarctica"' -simplify 50% -clean -o format=topojson ./data/maps/WORLD.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/states-10m.json -simplify 50% -clean -o format=topojson ./data/maps/USA.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/netherlands.json -simplify 10% -clean -o format=topojson ./data/maps/NLD.json
./node_modules/mapshaper/bin/mapshaper ./data/maps/italy_provinces.json -simplify 10% -clean -o format=topojson ./data/maps/ITA_2.json

# combine maps
./node_modules/mapshaper/bin/mapshaper -i ./data/maps/gadm36_CHN_1.json ./data/maps/gadm36_HKG_0.json ./data/maps/gadm36_MAC_0.json ./data/maps/gadm36_TWN_0.json combine-files -merge-layers force -o format=topojson ./data/maps/CHN_1.json
./node_modules/mapshaper/bin/mapshaper -i ./data/maps/gadm36_CHN_2.json ./data/maps/gadm36_HKG_0.json ./data/maps/gadm36_MAC_0.json ./data/maps/gadm36_TWN_0.json combine-files -merge-layers force -o format=topojson ./data/maps/CHN_2.json