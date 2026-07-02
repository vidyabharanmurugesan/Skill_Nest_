import json
import os
import sys
import csv

users_json_path = 'd:/project 22/backend/data/users.json'

if os.path.exists(users_json_path):
    try:
        with open(users_json_path, 'r', encoding='utf-8') as f:
            users = json.load(f)
        
        # Write CSV output to stdout
        if users:
            writer = csv.writer(sys.stdout)
            # Write headers
            headers = users[0].keys()
            writer.writerow(headers)
            # Write rows
            for user in users:
                writer.writerow(user.values())
        else:
            print("No users found in JSON database.")
    except Exception as e:
        print(f"Error reading users: {e}")
else:
    print("Users JSON file not found.")
