#!/bin/bash

mkdir -p ./data/maps
mkdir -p ./public/maps

# download maps
gadm_maps="CHN HKG MAC TWN KOR ITA FRA DEU JPN AUT AUS USA CAN ESP CHE GBR SWE POL NOR IRN PRT BRA MYS CHL BEL CZE RUS MEX ECU ARG PER IRL ZAF PHL ROU IDN SAU THA COL PAK HRV FIN UKR HUN DNK SVK ALB GRC EST SVN HTI DZA NGA SEN BOL HND TUR LKA"
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
wget -nc -q https://raw.githubusercontent.com/mesaugat/geoJSON-Nepal/master/nepal-states.geojson -O ./data/maps/nepal.json

# reference: https://covid-19-data.unstatshub.org/datasets/950f4a57d3354125befc7d6fb65e4ff5_0
wget -nc -q https://opendata.arcgis.com/datasets/950f4a57d3354125befc7d6fb65e4ff5_0.zip -O data/maps/ghana.zip
unzip -q -o -d ./data/maps/ ./data/maps/ghana.zip

# reference: https://covid19-geomatic.hub.arcgis.com/datasets/covid-19-au-maroc-par-r%C3%A9gion
wget -nc -q https://opendata.arcgis.com/datasets/454f46db2cfd49fca37245541810d18b_0.zip -O data/maps/morocco.zip
unzip -q -o -d ./data/maps/ ./data/maps/morocco.zip

# reference: https://data.humdata.org/dataset/administrative-boundaries-of-bangladesh-as-of-2015
wget -nc -q https://data.humdata.org/dataset/401d3fae-4262-48c9-891f-461fd776d49b/resource/0939d0f8-c814-4213-a5c9-241e67ec9fe9/download/bgd_admbnda_adm1_bbs_20180410.zip -O data/maps/bangladesh.zip

# simplify maps
yarn mapshaper ./data/maps/gadm36_CHN_1.shp -simplify 2% -clean -o format=topojson ./data/maps/gadm36_CHN_1.json
yarn mapshaper ./data/maps/gadm36_CHN_2.shp -simplify 2% -clean -o format=topojson ./data/maps/gadm36_CHN_2.json
yarn mapshaper ./data/maps/gadm36_HKG_0.shp -simplify 0.2% -clean -o format=topojson ./data/maps/gadm36_HKG_0.json
yarn mapshaper ./data/maps/gadm36_HKG_1.shp -simplify 20% -clean -o format=topojson ./data/maps/gadm36_HKG_1.json
yarn mapshaper ./data/maps/gadm36_MAC_0.shp -simplify 3% -clean -o format=topojson ./data/maps/gadm36_MAC_0.json
yarn mapshaper ./data/maps/gadm36_TWN_0.shp -simplify 0.5% -clean -o format=topojson ./data/maps/gadm36_TWN_0.json
yarn mapshaper ./data/maps/gadm36_KOR_1.shp -simplify 0.5% -clean -o format=topojson ./data/maps/gadm36_KOR_1.json
yarn mapshaper ./data/maps/gadm36_ITA_1.shp -simplify 1% -clean -o format=topojson ./data/maps/gadm36_ITA_1.json
yarn mapshaper ./data/maps/gadm36_FRA_1.shp -simplify 1% -clean -o format=topojson ./data/maps/gadm36_FRA_1.json
yarn mapshaper ./data/maps/gadm36_DEU_1.shp -simplify 1% -clean -o format=topojson ./data/maps/gadm36_DEU_1.json
yarn mapshaper ./data/maps/gadm36_JPN_1.shp -simplify 0.5% -clean -o format=topojson ./data/maps/gadm36_JPN_1.json
yarn mapshaper ./data/maps/gadm36_AUT_1.shp -simplify 5% -clean -o format=topojson ./data/maps/gadm36_AUT_1.json
yarn mapshaper ./data/maps/gadm36_AUS_1.shp -simplify 0.2% -clean -o format=topojson ./data/maps/gadm36_AUS_1.json
yarn mapshaper ./data/maps/gadm36_USA_2.shp -filter 'TYPE_2 != "Water body"' -simplify 0.5% -clean -o format=topojson ./data/maps/gadm36_USA_2.json
yarn mapshaper ./data/maps/gadm36_CAN_1.shp -simplify 0.3% -clean -o format=topojson ./data/maps/gadm36_CAN_1.json
yarn mapshaper ./data/maps/gadm36_ESP_1.shp -simplify 1% -clean -o format=topojson ./data/maps/gadm36_ESP_1.json
yarn mapshaper ./data/maps/gadm36_CHE_1.shp -simplify 10% -clean -o format=topojson ./data/maps/gadm36_CHE_1.json
yarn mapshaper ./data/maps/gadm36_GBR_2.shp -simplify 2% -clean -o format=topojson ./data/maps/gadm36_GBR_2.json
yarn mapshaper ./data/maps/gadm36_SWE_1.shp -simplify 0.5% -clean -o format=topojson ./data/maps/gadm36_SWE_1.json
yarn mapshaper ./data/maps/gadm36_POL_1.shp -simplify 2% -clean -o format=topojson ./data/maps/gadm36_POL_1.json
yarn mapshaper ./data/maps/gadm36_NOR_1.shp -simplify 1% -clean -o format=topojson ./data/maps/gadm36_NOR_1.json
yarn mapshaper ./data/maps/gadm36_IRN_1.shp -simplify 5% -clean -o format=topojson ./data/maps/gadm36_IRN_1.json
yarn mapshaper ./data/maps/gadm36_PRT_2.shp -simplify 1% -clean -o format=topojson ./data/maps/gadm36_PRT_2.json
yarn mapshaper ./data/maps/gadm36_BRA_1.shp -simplify 0.5% -clean -o format=topojson ./data/maps/gadm36_BRA_1.json
yarn mapshaper ./data/maps/gadm36_MYS_1.shp -simplify 2% -clean -o format=topojson ./data/maps/gadm36_MYS_1.json
yarn mapshaper ./data/maps/gadm36_CHL_1.shp -simplify 0.2% -clean -o format=topojson ./data/maps/gadm36_CHL_1.json
yarn mapshaper ./data/maps/gadm36_BEL_1.shp -simplify 20% -clean -o format=topojson ./data/maps/gadm36_BEL_1.json
yarn mapshaper ./data/maps/gadm36_CZE_1.shp -simplify 10% -clean -o format=topojson ./data/maps/gadm36_CZE_1.json
yarn mapshaper ./data/maps/gadm36_RUS_1.shp -simplify 0.5% -clean -o format=topojson ./data/maps/gadm36_RUS_1.json
yarn mapshaper ./data/maps/gadm36_MEX_1.shp -simplify 0.5% -clean -o format=topojson ./data/maps/gadm36_MEX_1.json
yarn mapshaper ./data/maps/gadm36_ECU_1.shp -simplify 1% -clean -o format=topojson ./data/maps/gadm36_ECU_1.json
yarn mapshaper ./data/maps/gadm36_ARG_1.shp -simplify 1% -clean -o format=topojson ./data/maps/gadm36_ARG_1.json
yarn mapshaper ./data/maps/gadm36_PER_1.shp -simplify 1% -clean -o format=topojson ./data/maps/gadm36_PER_1.json
yarn mapshaper ./data/maps/gadm36_IRL_1.shp -simplify 2% -clean -o format=topojson ./data/maps/gadm36_IRL_1.json
yarn mapshaper ./data/maps/gadm36_ZAF_1.shp -simplify 0.5% -clean -o format=topojson ./data/maps/gadm36_ZAF_1.json
yarn mapshaper ./data/maps/gadm36_PHL_1.shp -simplify 1% -clean -o format=topojson ./data/maps/gadm36_PHL_1.json
yarn mapshaper ./data/maps/gadm36_ROU_1.shp -simplify 5% -clean -o format=topojson ./data/maps/gadm36_ROU_1.json
yarn mapshaper ./data/maps/gadm36_IDN_1.shp -simplify 0.5% -clean -o format=topojson ./data/maps/gadm36_IDN_1.json
yarn mapshaper ./data/maps/gadm36_SAU_1.shp -simplify 1% -clean -o format=topojson ./data/maps/gadm36_SAU_1.json
yarn mapshaper ./data/maps/gadm36_THA_1.shp -simplify 2% -clean -o format=topojson ./data/maps/gadm36_THA_1.json
yarn mapshaper ./data/maps/gadm36_COL_1.shp -simplify 2% -clean -o format=topojson ./data/maps/gadm36_COL_1.json
yarn mapshaper ./data/maps/gadm36_PAK_1.shp -simplify 2% -clean -o format=topojson ./data/maps/gadm36_PAK_1.json
yarn mapshaper ./data/maps/gadm36_HRV_1.shp -simplify 2% -clean -o format=topojson ./data/maps/gadm36_HRV_1.json
yarn mapshaper ./data/maps/gadm36_FIN_4.shp -simplify 2% -clean -o format=topojson ./data/maps/gadm36_FIN_4.json
yarn mapshaper ./data/maps/gadm36_UKR_1.shp -simplify 2% -clean -o format=topojson ./data/maps/gadm36_UKR_1.json
yarn mapshaper ./data/maps/gadm36_HUN_1.shp -simplify 50% -clean -o format=topojson ./data/maps/gadm36_HUN_1.json
yarn mapshaper ./data/maps/gadm36_DNK_1.shp -simplify 2% -clean -o format=topojson ./data/maps/gadm36_DNK_1.json
yarn mapshaper ./data/maps/gadm36_SVK_1.shp -simplify 50% -clean -o format=topojson ./data/maps/gadm36_SVK_1.json
yarn mapshaper ./data/maps/gadm36_ALB_1.shp -simplify 10% -clean -o format=topojson ./data/maps/gadm36_ALB_1.json
yarn mapshaper ./data/maps/gadm36_LVA_1.shp -simplify 50% -clean -o format=topojson ./data/maps/gadm36_LVA_1.json
yarn mapshaper ./data/maps/gadm36_GRC_1.shp -simplify 2% -clean -o format=topojson ./data/maps/gadm36_GRC_1.json
yarn mapshaper ./data/maps/gadm36_EST_1.shp -filter 'TYPE_1 != "Water body"' -simplify 1% -clean -o format=topojson ./data/maps/gadm36_EST_1.json
yarn mapshaper ./data/maps/gadm36_SVN_1.shp -simplify 50% -clean -o format=topojson ./data/maps/gadm36_SVN_1.json
yarn mapshaper ./data/maps/gadm36_HTI_1.shp -simplify 5% -clean -o format=topojson ./data/maps/gadm36_HTI_1.json
yarn mapshaper ./data/maps/gadm36_DZA_1.shp -simplify 50% -clean -o format=topojson ./data/maps/gadm36_DZA_1.json
yarn mapshaper ./data/maps/gadm36_NGA_1.shp -simplify 5% -clean -o format=topojson ./data/maps/gadm36_NGA_1.json
yarn mapshaper ./data/maps/gadm36_SEN_1.shp -simplify 10% -clean -o format=topojson ./data/maps/gadm36_SEN_1.json
yarn mapshaper ./data/maps/gadm36_BOL_1.shp -simplify 10% -clean -o format=topojson ./data/maps/gadm36_BOL_1.json
yarn mapshaper ./data/maps/gadm36_HND_1.shp -simplify 2% -clean -o format=topojson ./data/maps/gadm36_HND_1.json
yarn mapshaper ./data/maps/gadm36_TUR_1.shp -simplify 5% -clean -o format=topojson ./data/maps/gadm36_TUR_1.json
yarn mapshaper ./data/maps/gadm36_LKA_1.shp -simplify 2% -clean -o format=topojson ./data/maps/gadm36_LKA_1.json

yarn mapshaper ./data/maps/world-50m.json -filter 'NAME != "Antarctica"' -simplify 50% -clean -o format=topojson ./data/maps/WORLD.json
yarn mapshaper ./data/maps/states-10m.json -simplify 50% -clean -o format=topojson ./data/maps/USA.json
yarn mapshaper ./data/maps/netherlands.json -simplify 10% -clean -o format=topojson ./data/maps/NLD.json
yarn mapshaper ./data/maps/italy_provinces.json -simplify 10% -clean -o format=topojson ./data/maps/ITA_2.json
yarn mapshaper ./data/maps/GHANA_16_REGIONS.shp -simplify 1% -clean -o format=topojson ./data/maps/GHA.json
yarn mapshaper ./data/maps/Covid_19.shp -simplify 1% -clean -o format=topojson ./data/maps/MAR.json
yarn mapshaper ./data/maps/bgd_admbnda_adm1_bbs_20180410.shp -simplify 2% -clean -o format=topojson ./data/maps/BGD.json
yarn mapshaper ./data/maps/nepal.json -simplify 5% -clean -o format=topojson ./data/maps/NPL.json

# combine maps
yarn mapshaper -i ./data/maps/gadm36_CHN_1.json ./data/maps/gadm36_HKG_0.json ./data/maps/gadm36_MAC_0.json ./data/maps/gadm36_TWN_0.json combine-files -merge-layers force -o format=topojson ./data/maps/CHN_1.json
yarn mapshaper -i ./data/maps/gadm36_CHN_2.json ./data/maps/gadm36_HKG_0.json ./data/maps/gadm36_MAC_0.json ./data/maps/gadm36_TWN_0.json combine-files -merge-layers force -o format=topojson ./data/maps/CHN_2.json