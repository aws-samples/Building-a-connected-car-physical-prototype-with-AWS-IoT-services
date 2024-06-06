"""
    Macchinetta, demo for showcase AWS IoT Fleetwise 
"""
import logging
import signal
import sys
import threading

from flask import Flask, render_template, Response
from flask_cors import CORS
from flask_socketio import SocketIO

from Actuators.Motor import MotorInterface
from Actuators.Servo import ServoInterface
from Actuators.Led import LedInterface
from Comm.Canbus import CanInterface
from Comm.Cloud import Cloud
from Comm.Car import Car
from ConfigReader import ConfigReader
from Sensors.Gps import GpsInterface
from Sensors.Adc import ADCInterface
from Sensors.Ultrasonic import UltrasonicInterface
from Sensors.Camera import CameraInterface

from hardware_manager import HardwareManager


# Configure logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    style='%'  # Use the old %-style formatting
)
logger = logging.getLogger(__name__)

# SETUP HARDWARE MANAGER
SENSOR_MANAGER = HardwareManager()
ACTUATOR_MANAGER = HardwareManager()
COMM_MANAGER = HardwareManager()

# REGISTER SENSORS
SENSOR_MANAGER.register_interface("camera", CameraInterface(logger))
SENSOR_MANAGER.register_interface("adc", ADCInterface())
SENSOR_MANAGER.register_interface("ultrasonic", UltrasonicInterface())
SENSOR_MANAGER.register_interface("gps", GpsInterface())

# REGISTER ACTUATORS
ACTUATOR_MANAGER.register_interface("led", LedInterface())
ACTUATOR_MANAGER.register_interface("servo", ServoInterface())
ACTUATOR_MANAGER.register_interface("motor", MotorInterface())

# REGISTER COMM
COMM_MANAGER.register_interface("canbus", CanInterface())

# Initialize Flask app and SocketIO
APP = Flask(__name__)
CORS(APP)
SOCKETIO = SocketIO(APP, cors_allowed_origins="*")
CLOUD = Cloud()

if __name__ == "__main__":
    """
    Main function to set up and run the vehicle application.
    """

    # Generator function to get frames from the camera
    def get_frame():
        empty_frame = (
            b"--frame\r\n"
            b"Content-Type:image/jpeg\r\n"
            b"Content-Length: 0\r\n"
            b"\r\n"
        )
        while vehicle.is_on:
            image_bytes = vehicle.get_camera_frame()
            if image_bytes is None:
                logger.warning("Camera returned empty frame")
                yield empty_frame
                continue
            yield (
                b"--frame\r\n"
                b"Content-Type:image/jpeg\r\n"
                b"Content-Length: " + f"{len(image_bytes)}".encode() + b"\r\n"
                b"\r\n" + image_bytes + b"\r\n"
            )


    # Flask route for the index page
    @APP.route("/")
    def index():
        return render_template("index.html", name=vehicle.name)

    # Flask route to get the vehicle state
    @APP.route("/getState", methods=["GET"])
    def getstate():
        return vehicle.get_state()

    # Flask route for the video feed
    @APP.route("/stream.mjpg")
    def video_feed():
        return Response(
            get_frame(), mimetype="multipart/x-mixed-replace; boundary=frame")

    # SocketIO event handlers
    @SOCKETIO.on("connect")
    def handle_connect():
        logger.info("Client connected")

    @SOCKETIO.on("disconnect")
    def handle_disconnect():
        logger.info("Client disconnected")

    @SOCKETIO.on("led")
    def led(data):
        vehicle.set_led(data)
        logger.info("Leds data received: %s", data)

    @SOCKETIO.on("head")
    def head(data):
        vehicle.move_head(data)

    @SOCKETIO.on("move")
    def move(data):
        vehicle.move_wheels(data)
        logger.info("Move data received: %s", data)

    @SOCKETIO.on("speed")
    def speed(data):
        vehicle.set_speed(data)

    # Function to run the SocketIO server
    def run_socketio():
        SOCKETIO.run(APP, host="0.0.0.0")

    # Signal handler function for graceful exit
    def signal_handler(sign, frame):
        logger.info("Exiting...")
        vehicle.stop()
        exit_event.set()

    try:
        # Get interfaces
        led_interface = ACTUATOR_MANAGER.get_interface("led")
        adc_interface = SENSOR_MANAGER.get_interface("adc")
        camera_interface = SENSOR_MANAGER.get_interface("camera")
        canbus_interface = COMM_MANAGER.get_interface("canbus")
        gps_interface = SENSOR_MANAGER.get_interface("gps")
        motor_interface = ACTUATOR_MANAGER.get_interface("motor")
        servo_interface = ACTUATOR_MANAGER.get_interface("servo")
        ultrasonic_interface = SENSOR_MANAGER.get_interface("ultrasonic")

        # Load configuration
        config = ConfigReader("config.json")
        vehicle_name = config.get("vehiclename")

        # Initialize components
        exit_event = threading.Event()
        vehicle = Car(
            adc=adc_interface,
            camera=camera_interface,
            canbus=canbus_interface,
            cloud=CLOUD,
            gps=gps_interface,
            servo=servo_interface,
            led=led_interface,
            logger=logger,
            motor=motor_interface,
            name=vehicle_name,
            socketio=SOCKETIO,
            ultrasonic=ultrasonic_interface,
        )
        socketio_thread = threading.Thread(target=run_socketio, daemon=True)

        # Start components
        socketio_thread.start()
        vehicle.start()

        # Set up signal handler for graceful exit
        signal.signal(signal.SIGINT, signal_handler)

        # Wait for exit signal
        while not exit_event.is_set():
            exit_event.wait(timeout=1)

    except Exception as e:
        logger.error("An error occurred: %s", e)
        sys.exit(1)
