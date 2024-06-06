from abc import ABCMeta, abstractmethod

class ActuatorInterface(metaclass=ABCMeta):
  
    @abstractmethod
    def read(self, value):
        return

    @abstractmethod
    def write(self, value):
        return 
  