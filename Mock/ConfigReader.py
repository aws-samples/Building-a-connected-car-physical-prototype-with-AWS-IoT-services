import json

class ConfigReader:

  def __init__(self, config_file):
    with open(config_file) as f:
      self.config = json.load(f)

  def get(self, key):
    return self.config[key]

# Example usage
#config = ConfigReader('config.json')
#api_key = config.get('api_key')
