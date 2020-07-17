import os
import datetime
import tabula
from pathlib import Path
import re

data_folder = 'data/sri-lanka-data/'
data_files = os.listdir(data_folder)

districts = [
    'Colombo', 'Gampaha', 'Puttalam', 'Kalutara', 'Anuradhapura', 'Kandy',
    'Kurunegala', 'Jaffna', 'Ratnapura', 'Polonnaruwa', 'Kegalle',
    'Moneragala', 'Kalmunai', 'Matale', 'Galle', 'Badulla', 'Matara',
    'Batticoloa', 'Hambantota', 'Vavunia', 'Trincomalee', 'Ampara',
    'Nuwaraeliya', 'Kilinochchi', 'Mannar', 'Mullativu'
]

first_date = datetime.date(2020, 3, 20)

curr_date = first_date
today = datetime.date.today()

while curr_date < today:
    curr_date_str = curr_date.strftime('%Y-%m-%d')
    file_name = curr_date_str + '.csv'

    if not file_name in data_files:
        pdf_link = 'http://www.epid.gov.lk/web/images/pdf/corona_virus_report/sitrep-sl-en-' + curr_date.strftime(
            '%d') + '-' + curr_date.strftime('%m') + '_10.pdf'
        temp_file = data_folder + file_name + '_tmp'
        try:
            tabula.convert_into(pdf_link,
                                temp_file,
                                output_format="csv",
                                pages=2,
                                area=(29, 340, 745, 594))

            temp_f = open(temp_file, 'r')
            f = open(data_folder + file_name, 'w')

            pattern = '|'.join([x.upper() for x in districts])
            pattern = '(' + pattern + ')(\d+)'
            lines = temp_f.readlines()
            for line in lines:
                new_line = re.sub(r'(\s|\n)', '', line)
                letters = re.sub(r'\d', '', new_line)
                numbers = re.sub(r'[A-Za-z]', '', new_line)
                match = re.search(pattern, letters + numbers)
                if match is not None:
                    f.write(match.group(1) + ',' + match.group(2) + '\n')

            temp_f.close()
            f.close()
        except:
            print('Cannot parse Sri Lanka data for ' + curr_date_str)

    # next day
    curr_date += datetime.timedelta(days=1)

# clean temp files
for p in Path(data_folder).glob("*.csv_tmp"):
    p.unlink()
