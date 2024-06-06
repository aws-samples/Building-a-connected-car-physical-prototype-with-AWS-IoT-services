import math
import json
import time
import datetime
import threading

blink_thread = None  # Declare a global variable to hold the blink thread


class Car:
    def __init__(
        self,
        adc,
        camera,
        gps,
        led,
        motor,
        name,
        servo,
        socketio,
        ultrasonic,
        canbus=None,
        cloud=None,
        logger=None,
    ):
        self.adc = adc
        self.camera = camera
        self.camera_streaming = True
        self.canbus = canbus
        self.cloud = cloud
        self.direction = "stop"
        self.gps = gps
        self.headX = 90
        self.headY = 90
        self.led1 = False
        self.led2 = False
        self.led_stripe = led
        self.logger = logger  # Initialize the logger
        self.metric_delay = 2
        self.motor = motor
        self.name = name
        self.servo = servo
        self.socketio = socketio
        self.speed = 0
        self.ultrasonic = ultrasonic

    def move_head(self, head):
        if head == "up":
            if (self.headY + 10) <= 180:
                self.headY += 10
        elif head == "right":
            if (self.headX + 10) <= 180:
                self.headX += 10
        elif head == "left":
            if (self.headX - 10) >= 0:
                self.headX -= 10
        elif head == "down":
            if (self.headY - 10) >= 0:
                self.headY -= 10
        self.servo.write(["0", self.headX])
        self.servo.write(["1", self.headY])

    def move_wheels(self, data):
        self.direction = data
        # Convert speed to number of pulses by multiplying by 40.96
        s = math.floor(float(self.speed) * 40.96)
        s_lower = math.floor(float(s // 1.1))
        t = math.floor(float(s // 1.2))  # Different wheel speeds for turning
        dir = self.direction
        if dir == "up":
            self.motor.write([s, s, s, s])
        elif dir == "left":
            self.motor.write([-t, -t, s, s_lower])
        elif dir == "right":
            self.motor.write([s, s_lower, -t, -t])
        elif dir == "down":
            self.motor.write([-s, -s, -s, -s])
        else:
            self.motor.write([0, 0, 0, 0])

    def start(self):
        if self.logger:
            self.logger.info("Car started")
        self.is_on = True
        self.camera.start()
        self.servo.write(["0", self.headX])
        self.servo.write(["1", self.headY])
        self.led_stripe.write([0x04, 0, 0, 0])
        self.speed_thread = self.socketio.start_background_task(self.emit_metrics)
        if hasattr(self, 'cloud'):
            self.cloud.connect(self.set_led)
            self.logger.info("Cloud services started")

    def stop(self):
        self.is_on = False
        self.camera.stop()
        if hasattr(self, 'canbus'):
            self.canbus.close_connection()
            if self.logger:
                self.logger.info("Canbus Closed")

        if hasattr(self, 'cloud'):
            self.cloud.disconnect()
            if self.logger:
                self.logger.info("Cloud Disconnected")
     
    
        self.motor.write([0, 0, 0, 0])
        self.led_stripe.write([0x02, 0, 0, 0])
        self.led_stripe.write([0x04, 0, 0, 0])
        if self.logger:
            self.logger.info("Car stopped")
        if self.speed_thread:
            self.speed_thread.join()

    def emit_metrics(self):
        while self.is_on:
            self.emit_power()
            self.emit_distance()
            self.emit_coordinates()
            time.sleep(self.metric_delay)

    def pub_to_canbus(self, name, val):
        if self.logger:
            self.logger.info(f"{datetime.datetime.now()} Set {name} to {val}")
        self.canbus.publish(name, val)

    def emit_power(self):
        self.battery = round(self.adc.read(2), 2) * 3
        message = json.dumps({"power": self.battery})
        self.socketio.emit("power", message)
        self.pub_to_canbus("BatteryPackVoltage", self.battery)
        self.pub_to_canbus("ChargeLevel", (self.battery) / 9 * 100)

    def emit_distance(self):
        self.distance = self.ultrasonic.read()
        message = json.dumps({"distance": self.distance})
        self.socketio.emit("distance", message)

    def emit_coordinates(self):
        self.route = [round(coord, 10) for coord in self.gps.read()[0]]
        message = json.dumps({"coordinate": self.route})
        self.socketio.emit("coordinate", message)

    def set_led(self, data):
        try:
            d = json.loads(data)
            led_type = d["led"]
            status = d["status"]

            led_config = {
                "RedLed": [0x04, (255, 0, 0) if status else (0, 0, 0)],
                "GreenLed": [0x02, (0, 255, 0) if status else (0, 0, 0)]
            }

            if led_type in led_config:
                led_data = led_config[led_type]
                self.led_stripe.write([led_data[0]] + list(led_data[1]))
                self.pub_to_canbus(led_type, status)
                if led_type == "RedLed":
                    self.led1 = status
                elif led_type == "GreenLed":
                    self.led2 = status
            else:
                if self.logger:
                    self.logger.info(f"Unknown LED type: {led_type}")
        except (ValueError, KeyError) as e:
            if self.logger:
                self.logger.error(f"Error setting LED: {e}")

    def set_speed(self, data):
        self.speed = data
        self.pub_to_canbus("ActualVehicleSpeed", self.speed)

    def get_camera_frame(self):
        if self.camera_streaming:
            image_bytes = self.camera.read()
            return image_bytes
        else:
            return None

    def close(self):
        self.stop()

    def get_state(self):
        return {
            "RedLed": self.led1,
            "GreenLed": self.led2,
            "Detect": self.camera_streaming
        }