import math
import json
import datetime

from flask import Flask, render_template, request
from flask_socketio import SocketIO
from flask_cors import CORS
from threading import Lock, Thread


from ConfigReader import ConfigReader
from Comm.Cloud import Cloud

from hardware_manager import HardwareManager
from Sensors.Gps import GpsInterface

from mock_hardware import (
    MockADCInterface, MockMotorInterface, MockUltrasonicInterface,
    MockLedInterface, MockServoInterface, MockCanInterface
)

hw_manager = HardwareManager()
sensor_manager = HardwareManager()
#comm_manager = HardwareManager()

hw_manager.register_interface("adc", MockADCInterface())
hw_manager.register_interface("ultrasonic", MockUltrasonicInterface())
hw_manager.register_interface("motor", MockMotorInterface())
hw_manager.register_interface("led", MockLedInterface())
hw_manager.register_interface("servo", MockServoInterface())
hw_manager.register_interface("canbus", MockCanInterface())


sensor_manager.register_interface("gps", GpsInterface())

# Create mock instances
adc = hw_manager.get_interface("adc")
motor = hw_manager.get_interface("motor")
ultrasonic = hw_manager.get_interface("ultrasonic")
led = hw_manager.get_interface("led")
servo = hw_manager.get_interface("servo")
canbus = hw_manager.get_interface("canbus")


gps = sensor_manager.get_interface("gps")

app = Flask(__name__)
CORS(app)
socketio=SocketIO(app, cors_allowed_origins="*")
cloud = Cloud()

thread = None
thread_lock = Lock()

class car:
  def __init__(self, name):
    self.name = name
    self.route = gps.read()
    self.battery = round(adc.read(2),2)*3
    self.distance = ultrasonic.read()
    self.led1 = led.read(1)
    self.led2 = led.read(2)
    self.speed = 0
    self.direction = "stop"
    self.headX = 90
    self.headY = 90
    
    servo.write(['0',self.headX])
    servo.write(['1',self.headY])

  def move_head(self,head):
    if head == "up":
      if (self.headY + 10) <= 180:
        self.headY += 10
    elif head == "left":
      if (self.headX + 10) <= 180:
        self.headX += 10
    elif head == "right":
      if (self.headX - 10) >= 0:
        self.headX -= 10 
    elif head == "down":
        if (self.headY - 10) >= 0:
           self.headY -= 10
    servo.write(['0',self.headX])
    servo.write(['1',self.headY])  

  def move(self):
    # la velocità va convertita in numero di impulsi moltiplicandola per 40,96
    s = math.floor(float(self.speed)*40.96)
    #s_lower = math.floor(float(s//1.1))
    #t = math.floor(float(s//1.5)) # per girare la velocità delle ruote deve essere diversa
    t = s//4 # per girare la velocità delle ruote deve essere diversa
    dir = self.direction
    if dir == "up":
        motor.write([s,s,s,s])
    elif dir == "left":
        motor.write([t,-s,t,s]) 
        #motor.write([t,-t,s,s_lower]) 
    elif dir == "right":
        motor.write([t,s,t,-s]) 
        #motor.write([s,s_lower,-t,-t]) 
    elif dir == "down":
        motor.write([-s,-s,-s,-s]) 
        #motor.write([-s,-s,-s,-s])
    else:
        motor.write([0,0,0,0])

  def light_led(self, data):
    print(data)
    d = json.loads(data)
    if (d["led"] == 1):
      self.led1 = d["status"]
      if (d["status"] == 1):
        led.write([0x04,255,0,0])
      else: 
        led.write([0x04,0,0,0])
      
      pub_to_canbus(canbus.publish, "RedLed", vehicle.led1)
      cloud.change_shadow_value("RedLed", vehicle.led1)
    
    if (d["led"] == 2):
      self.led2 = d["status"]
      if (d["status"] == 1):
        led.write([0x02,0,255,0])
      else: 
        led.write([0x02,0,0,0])
  
      pub_to_canbus(canbus.publish, "GreenLed", vehicle.led2)
      cloud.change_shadow_value("GreenLed",vehicle.led2)

  def stop(self):
    motor.write([0,0,0,0])

def emit_power():
    vehicle.battery= round(adc.read(2),2)*3
    json_dict = {"power": vehicle.battery}
    j = json.dumps(json_dict)
    socketio.emit('power', j)
    pub_to_canbus(canbus.publish, "BatteryPackVoltage", vehicle.battery)
    pub_to_canbus(canbus.publish, "ChargeLevel", (vehicle.battery)/9*100)

def emit_distance():
    vehicle.distance = ultrasonic.read()
    json_dict = {"distance": vehicle.distance}
    j = json.dumps(json_dict)
    socketio.emit('distance', j)

def emit_coordinates(index):
  if len(vehicle.route) > index:
    json_dict = {"coordinate": vehicle.route[index]}
    j = json.dumps(json_dict)
    socketio.emit('coordinate', j)

@app.route('/')
def index():
    return render_template('index.html', name=vehicle.name)

@app.route("/setled", methods = ['POST'])
def setled():
    print("--- /setled ----")
    payload = request.get_json()
    print(payload)
    socketio.emit('ledFromCloud', payload)
    return "ok"

@socketio.on("start")
def start():
    pass
    pub_to_canbus(canbus.publish, "VehicleStatus", 1) # on

@socketio.on('stop')
def stop():
    vehicle.stop()
    pub_to_canbus(canbus.publish, "VehicleStatus", 0) # off

@socketio.on("led")
def ledlight(data):
   print("--- LED ----")
   print(data)
   vehicle.light_led(data)

@socketio.on("head")
def head(data):
    vehicle.move_head(data) 

@socketio.on("move")
def move(data):
    vehicle.direction = data
    vehicle.move()
    pub_to_canbus(canbus.publish, "VehicleStatus", 2) # moving

@socketio.on("speed")
def speed(data):
    vehicle.speed = data
    vehicle.move()
    pub_to_canbus(canbus.publish, "VehicleSpeed", vehicle.speed)

@socketio.on('startTimer')
def startTimer():
    global thread
    with thread_lock:
        if thread is None:
          thread = socketio.start_background_task(info_thread)

@socketio.on("stopTimer")
def stopTimer():
    global thread
    with thread_lock:
      if thread is not None:
          thread.join()
          thread = None

@socketio.on('connect')
def connect():
  print("SocketIO connected")

@socketio.on('disconnect')  
def button():
  print("SocketIO disconnected")


def info_thread():
  index = 0
  while True:
    emit_power()
    emit_distance()
    emit_coordinates(index)
    index += 1
    socketio.sleep(5)
  
def pub_to_canbus(func, name, val):
    #print(str(datetime.datetime.now()) + " Set " + name + " to " + str(val))
    func(name, val)

if __name__ == '__main__':
    try:
      config = ConfigReader('config.json')
      name = config.get('vehiclename')
      vehicle = car(name)
      socketio.run(app, host='0.0.0.0')
    except KeyboardInterrupt:
      vehicle.disconnect()
