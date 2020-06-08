import os
import datetime
import tabula
from pathlib import Path
import re

data_folder = 'data/slovenia-data/'
data_files = os.listdir(data_folder)

first_date = datetime.date(2020, 4, 14)

curr_date = first_date
today = datetime.date.today()

while curr_date < today:
    curr_date_str = curr_date.strftime('%Y-%m-%d')
    file_name = curr_date_str + '.csv'

    if not file_name in data_files:
        pdf_link = 'https://www.nijz.si/sites/www.nijz.si/files/uploaded/covid_obcine_' + curr_date.strftime(
            '%d%m%Y') + '.pdf'
        temp_file = data_folder + file_name + '_tmp'
        try:
            tabula.convert_into(pdf_link,
                                temp_file,
                                output_format="csv",
                                pages='all',
                                stream=True)

            temp_f = open(temp_file, 'r')
            f = open(data_folder + file_name, 'w')

            lines = temp_f.readlines()
            lines = [
                re.compile('(\d)\s(\d)').sub(r'\1,\2', line) for line in lines
                if not line.startswith('"')
            ]
            f.writelines(lines)

            temp_f.close()
            f.close()
        except:
            print('Cannot parse Solvenia data for ' + curr_date_str)

    # next day
    curr_date += datetime.timedelta(days=1)

# clean temp files
for p in Path(data_folder).glob("*.csv_tmp"):
    p.unlink()
