#!/bin/bash

#scripts="download_maps download_data data_processing"
scripts="download_data data_processing"

for script in $scripts; do
    ./scripts/${script}.sh
    if [ $? != 0 ]; then
       exit 1
    fi
done