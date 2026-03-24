import pandas as pd
import os

users_excel = 'd:/project 22/backend/data/users.xlsx'
import sys
if os.path.exists(users_excel):
    try:
        df = pd.read_excel(users_excel, sheet_name='Users')
        df.to_csv(sys.stdout, index=False)
    except Exception as e:
        print(f"Error reading users: {e}")
else:
    print("Users Excel file not found.")
