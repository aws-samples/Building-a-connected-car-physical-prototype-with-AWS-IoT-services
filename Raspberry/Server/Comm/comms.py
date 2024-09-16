from abc import ABCMeta, abstractmethod

class CommInterface(metaclass=ABCMeta):
  
    @abstractmethod
    def subscribe(self, topic):
        return

    @abstractmethod
    def publish(self, topic, message):
        return 
  