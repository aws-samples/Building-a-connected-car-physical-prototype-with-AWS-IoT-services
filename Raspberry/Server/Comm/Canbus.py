from Comm.Canigen import Canigen
from ConfigReader import ConfigReader
from Comm.comms import CommInterface


class CanInterface(CommInterface):
    def __init__(self):
        config = ConfigReader("config.json")
        self.can = Canigen(
            interface=config.get("canInterface"),
            database_filename=config.get("canDatabase"),
        )

    def subscribe(self, value):
        return

    def publish(self, topic, message):
        self.can.set_sig(topic, message)

    def close_connection(self):
        self.can.stop()
