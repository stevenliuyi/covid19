import os
import datetime
import json
import requests

data_folder = 'data/serbia-data/'
data_files = os.listdir(data_folder)

first_date = datetime.date(2020, 3, 6)

curr_date = first_date
today = datetime.date.today()

url = 'https://covid19.data.gov.rs/api/datasets/statistic/download_CSV'
headers = {'Content-type': 'application/json'}

while curr_date < today:
    curr_date_str = curr_date.strftime('%Y-%m-%d')
    file_name = curr_date_str + '.csv'

    if not file_name in data_files:
        # total cases
        data = {
            "dataSetId":
            1,
            "refCodes": [{
                "id": 1,
                "code": "COVID-19 statistics",
                "values": [{
                    "id": 2,
                    "name": "Total Cases"
                }]
            }],
            "territoryIds": [
                168, 40, 41, 169, 170, 42, 43, 44, 171, 172, 173, 174, 45, 46,
                177, 175, 47, 176, 163, 64, 65, 66, 67, 68, 69, 70, 71, 151,
                150, 146, 211, 149, 147, 220, 219, 84, 85, 86, 81, 217, 218,
                82, 242, 83, 182, 183, 222, 91, 133, 223, 184, 185, 92, 224,
                93, 94, 96, 95, 225, 226, 238, 160, 186, 187, 97, 98, 99, 100,
                102, 188, 101, 103, 153, 104, 227, 105, 228, 108, 109, 106,
                107, 110, 189, 111, 112, 113, 114, 115, 116, 164, 190, 117,
                191, 192, 118, 193, 229, 230, 195, 194, 231, 119, 196, 120,
                232, 197, 121, 213, 122, 198, 233, 123, 124, 125, 126, 127,
                235, 234, 128, 130, 131, 129, 132, 199, 152, 201, 200, 162,
                212, 136, 137, 138, 139, 202, 236, 203, 204, 205, 206, 240,
                241, 207, 140, 237, 134, 135, 208, 209, 142, 143, 144, 145,
                148, 239, 141, 72, 73, 74, 75, 215, 77, 76, 78, 79, 161, 210,
                80, 178, 216, 179, 87, 88, 90, 180, 89, 181, 221, 243
            ],
            "territoryGroupId":
            5,
            "number":
            10,
            "dimTime":
            curr_date_str
        }

        output = requests.post(url=url, data=json.dumps(data), headers=headers)

        f = open(data_folder + 'total_cases/' + file_name, 'w')
        f.write(output.text)
        f.close()

        # new cases
        data["refCodes"][0]["values"] = [{"id": 1, "name": "Daily New Cases"}]

        output = requests.post(url=url, data=json.dumps(data), headers=headers)

        f = open(data_folder + 'new_cases/' + file_name, 'w')
        f.write(output.text)
        f.close()

    # next day
    curr_date += datetime.timedelta(days=1)