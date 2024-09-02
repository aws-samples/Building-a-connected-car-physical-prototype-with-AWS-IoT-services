import boto3

from botocore.config import Config
from botocore import UNSIGNED
from Sensors.sensors import SensorInterface
from ConfigReader import ConfigReader

class GpsInterface(SensorInterface):
    def __init__(self):
      config = ConfigReader('config.json')
      self.api_key = config.get('apikey')
      self.region = config.get('region')
      self.index = config.get('routecalculator')
      self.departurePosition = config.get('gpsStart')
      self.destinationPosition = config.get('gpsEnd')
      
      bconfig = Config(
        region_name = self.region,
        signature_version=UNSIGNED
      )
      self.client = boto3.client('location', config=bconfig)
    
    def calculate_route(self):
        directions = self.client.calculate_route (
          CalculatorName=self.index,    
          DepartNow = True,
          Key = self.api_key,
          CarModeOptions={
            'AvoidFerries': True,
            'AvoidTolls': True
          },
          DistanceUnit='Kilometers',
          IncludeLegGeometry=True,
          TravelMode='Car',
          DeparturePosition = self.departurePosition,
          DestinationPosition = self.destinationPosition
        )
        return directions['Legs'][0]['Geometry']['LineString']

    def read(self):
        return self.calculate_route()




