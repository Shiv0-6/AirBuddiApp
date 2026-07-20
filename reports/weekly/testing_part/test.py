import requests

url = "https://9fsa0alosl.execute-api.eu-north-1.amazonaws.com/devices"

# GET request
get_resp = requests.get(url)
print("GET data:", get_resp.json())

# POST request
post_resp = requests.post(url, json={"topic": "esp/control", "message": "start"})
print("POST response:", post_resp.json())


# python test.py