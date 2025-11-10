import requests

def fetch_data(url):
    try:
        data = {
  "email": "string",
  "password": "string"
}
        response = requests.post(url, json=data)
        response.raise_for_status()  # Raise an error for bad status codes
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")
        return None

url = "https://faceauthen-backend.onrender.com/auth/login"
result = fetch_data(url)
if result:
    print(result)