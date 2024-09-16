from abc import ABCMeta, abstractmethod

class SensorInterface(metaclass=ABCMeta):
  
    @abstractmethod
    def read(self, value):
        return
  