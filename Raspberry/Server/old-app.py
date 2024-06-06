import math
import json
import datetime
import os 
import time
from flask import Flask, render_template, Response, request
from flask_socketio import SocketIO
from flask_cors import CORS
import threading
from hardware_manager import HardwareManager
from Sensors.Adc import ADCInterface
from Sensors.Gps import GpsInterface
from Sensors.Camera import CameraInterface
from Actuators.Motor import MotorInterface
from Sensors.Ultrasonic import UltrasonicInterface
from Actuators.Led import LedInterface
from Actuators.Servo import ServoInterface
from Comm.Cloud import Cloud
from Comm.Canbus import CanInterface
from ConfigReader import ConfigReader

sensor_manager = HardwareManager()
actuator_manager = HardwareManager()
comm_manager = HardwareManager()

sensor_manager.register_interface("adc", ADCInterface())
sensor_manager.register_interface("gps", GpsInterface())
sensor_manager.register_interface("ultrasonic", UltrasonicInterface())
sensor_manager.register_interface("camera", CameraInterface())

actuator_manager.register_interface("motor", MotorInterface())
actuator_manager.register_interface("led", LedInterface())
actuator_manager.register_interface("servo", ServoInterface())

comm_manager.register_interface("canbus", CanInterface())

adc = sensor_manager.get_interface("adc")
gps = sensor_manager.get_interface("gps")
camera = sensor_manager.get_interface("camera")
motor = actuator_manager.get_interface("motor")
ultrasonic = sensor_manager.get_interface("ultrasonic")
led = actuator_manager.get_interface("led")
servo = actuator_manager.get_interface("servo")
canbus = comm_manager.get_interface("canbus")


blink_thread = None  # Declare a global variable to hold the blink thread
app = Flask(__name__)
CORS(app)
socketio=SocketIO(app, cors_allowed_origins="*")
cloud = Cloud()
thread = None
thread_lock = threading.Lock()

class car:
  def __init__(self, name):
    self.name = name
    self.route = gps.read()
    self.battery = round(adc.read(2),2)*3
    self.distance = ultrasonic.read()
    self.led1 = False
    self.led2 = False
    self.speed = 0
    self.direction = "stop"
    self.headX = 90
    self.headY = 90
    self.camera = camera
    self.camera.start()
    self.danger = False
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
    s_lower = math.floor(float(s//1.1))
    t = math.floor(float(s//1.2)) # per girare la velocità delle ruote deve essere diversa
    #t = s//4 # per girare la velocità delle ruote deve essere diversa
    dir = self.direction
    if dir == "up":
        motor.write([s,s,s,s])
    elif dir == "left":
        #motor.write([t,-s,t,s]) 
        motor.write([-t,-t,s,s_lower]) 
    elif dir == "right":
        #motor.write([t,s,t,-s]) 
        motor.write([s,s_lower,-t,-t]) 
    elif dir == "down":
        motor.write([-s,-s,-s,-s]) 
    else:
        motor.write([0,0,0,0])

  def stop(self):
    motor.write([0,0,0,0])

def emit_power():
    vehicle.battery= round(adc.read(2),2)*3
    json_dict = {"power": vehicle.battery}
    j = json.dumps(json_dict)
    socketio.emit('power', j)
    pub_to_canbus(canbus.publish, "BatteryPackVoltage", vehicle.battery)
    pub_to_canbus(canbus.publish, "ChargeLevel", (vehicle.battery)/9*100)
    cloud.change_shadow_value("Battery",  round(vehicle.battery,2), "all")


def emit_distance():
    vehicle.distance = ultrasonic.read()
    json_dict = {"distance": vehicle.distance}
    j = json.dumps(json_dict)
    socketio.emit('distance', j)

def emit_coordinates():
    for i in range(len(vehicle.route)):
      socketio.emit('coordinate', vehicle.route[i])

def get_frame():
  while vehicle.camera.streaming:
    
    image_bytes, label = vehicle.camera.read()
    if image_bytes is None:
        vehicle.camera.initialize_capture()
        image_bytes = vehicle.camera.read()
    if label and  vehicle.danger == False:
      json_dict = {"danger": label}
      j = json.dumps(json_dict)
      signalDanger(j)
    if label == "":
      vehicle.danger = False

    yield (b'--frame\r\n'
          b'Content-Type:image/jpeg\r\n'
          b'Content-Length: ' + f"{len(image_bytes)}".encode() + b'\r\n'
          b'\r\n' + image_bytes + b'\r\n')

@app.route('/')
def index():
    return render_template('index.html', name=vehicle.name)

def signalDanger(data):
    global blink_thread  # Access the global variable
    def blink_leds():
        d = json.loads(data)
        for i in range(3):
            led.write([0x01, 255, 255, 0])
            led.write([0x08, 255, 255, 0])
            led.write([0x10, 255, 255, 0])
            led.write([0x20, 255, 255, 0])
            led.write([0x40, 255, 255, 0])
            led.write([0x80, 255, 255, 0])
            time.sleep(0.3)
            led.write([0x01, 0, 0, 0])
            led.write([0x08, 0, 0, 0])
            led.write([0x10, 0, 0, 0])
            led.write([0x20, 0, 0, 0])
            led.write([0x40, 0, 0, 0])
            led.write([0x80, 0, 0, 0])
            time.sleep(0.5)  # Add a delay of 0.5 seconds between each on/off cycle

        vehicle.danger = True

    if blink_thread is None or not blink_thread.is_alive():
        blink_thread = threading.Thread(target=blink_leds)
        blink_thread.start()

def ledlight_cloud(data):
    d = json.loads(data)
    if (d["led"] == "RedLed"):
      vehicle.led1 = d["status"]
      if (d["status"]):
        led.write([0x04,255,0,0])
      else: 
        led.write([0x04,0,0,0])
      pub_to_canbus(canbus.publish, "RedLed", vehicle.led1)
      cloud.change_shadow_value("RedLed", vehicle.led1, "all")
    if (d["led"] == "GreenLed"):
      vehicle.led2 = d["status"]
      if (d["status"]):
        led.write([0x02,0,255,0])
      else: 
        led.write([0x02,0,0,0])

      pub_to_canbus(canbus.publish, "GreenLed", vehicle.led2)
      cloud.change_shadow_value("GreenLed", vehicle.led2, "all")


@app.route("/setled", methods = ['POST'])
def setled():
    payload = request.get_json()
    print(json.dumps(payload))
    ledlight_cloud(json.dumps(payload))
    return "ok"

@app.route("/getState", methods = ['GET'])
def getstate():
    payload = {'RedLed':vehicle.led1 , 'GreenLed':vehicle.led2, 'Detect': vehicle.camera.rekon_on  }
    return payload


@app.route('/stream.mjpg')
def video_feed():
    return Response(get_frame(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@socketio.on("start")
def start():
    pass
    pub_to_canbus(canbus.publish, "VehicleStatus", 1) # on

@socketio.on('stop')
def stop():
    vehicle.stop()
    pub_to_canbus(canbus.publish, "VehicleStatus", 0) # off

@socketio.on('detect')
def enableDetect(data):
    d = json.loads(data)
    vehicle.camera.rekon_on=d["detect"]


      
@socketio.on("led")
def ledlight(data):
    d = json.loads(data)
    if (d["led"] == 1):
      vehicle.led1 = d["status"]
      if (d["status"]):
        led.write([0x04,255,0,0])
      else: 
        led.write([0x04,0,0,0])

      pub_to_canbus(canbus.publish, "RedLed", vehicle.led1)
      cloud.change_shadow_value("RedLed", vehicle.led1, "all")

    if (d["led"] == 2):
      vehicle.led2 = d["status"]
      if (d["status"]):
        led.write([0x02,0,255,0])
      else: 
        led.write([0x02,0,0,0])
    
      pub_to_canbus(canbus.publish, "GreenLed", vehicle.led2)
      cloud.change_shadow_value("GreenLed",vehicle.led2,  "all")

@socketio.on("head")
def head(data):
    vehicle.move_head(data) 

@socketio.on("move")
def move(data):
    vehicle.direction = data
    vehicle.move()
    pub_to_canbus(canbus.publish, "VehicleStatus", 2) 

@socketio.on("speed")
def speed(data):
    vehicle.speed = data
    vehicle.move()
    pub_to_canbus(canbus.publish, "ActualVehicleSpeed", vehicle.speed)
    cloud.change_shadow_value("Speed", round(vehicle.speed, 2), "all")

@socketio.on('startTimer')
def startTimer():
    global thread
    with thread_lock:
        if thread is None:
          thread = socketio.start_background_task(background_thread)

@socketio.on("stopTimer")
def stopTimer():
    global thread
    with thread_lock:
      if thread is not None:
          thread.join()
          thread = None


##CONTROLLER EVENT
@socketio.on("ledController")
def ledlightController(data):
    d = json.loads(data)
    if (d["led"] == "red"):
      vehicle.led1 = not vehicle.led1
      if (vehicle.led1):
        led.write([0x04,255,0,0])
      else: 
        led.write([0x04,0,0,0])
      pub_to_canbus(canbus.publish, "RedLed", vehicle.led1)
      cloud.change_shadow_value("RedLed", vehicle.led1, "all")
    if (d["led"] == "green"):
      vehicle.led2 = not vehicle.led2
      if (vehicle.led2):
        led.write([0x02,0,255,0])
      else: 
        led.write([0x02,0,0,0])
      pub_to_canbus(canbus.publish, "GreenLed", vehicle.led2)
      cloud.change_shadow_value("GreenLed", vehicle.led2, "all")

@socketio.on('detectController')
def enableDetect(data):
    d = json.loads(data)
    if (d["action"] == "detect"):
      vehicle.camera.rekon_on= not vehicle.camera.rekon_on
def background_thread():
  while True:
    emit_power()
    emit_distance()
    emit_coordinates()
    socketio.sleep(5)

def pub_to_canbus(func, name, val):
    print(str(datetime.datetime.now()) + " Set " + name + " to " + str(val))
    func(name, val)

def signal_handler(signal, frame):
    print('Disconnecting from the cloud...')
    cloud.disconnect()
    sys.exit(0)
    
if __name__ == '__main__':
    try:
        config = ConfigReader('config.json')
        name = config.get('vehiclename')
        if(config.get('stream_video') == "True"):
            # Set GST KVSSINK plugin path
            os.environ["GST_PLUGIN_PATH"] = config.get("gstPluginPath")

        vehicle = car(name)
        cloud.connect()
        socketio.run(app, host='0.0.0.0')

    except KeyboardInterrupt:
        #socketio.emit("stop")
        pass

    finally:
      led.write([0x02,0,0,0])
      led.write([0x04,0,0,0])
  
      vehicle.camera.release()
