#from hardware import HardwareInterface
#from Sensors import SensorInterface
#from Actuators import ActuatorInterface
#from Comm import CommInterface

class HardwareManager():
  def __init__(self):
    self.interfaces = {}

  def register_interface(self, name, interface):
    self.interfaces[name] = interface

  def get_interface(self, name):
    return self.interfaces[name]