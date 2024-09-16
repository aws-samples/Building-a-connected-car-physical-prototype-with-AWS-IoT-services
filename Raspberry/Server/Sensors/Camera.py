from Sensors.sensors import SensorInterface
import cv2
import asyncio
import json
from ConfigReader import ConfigReader
import base64
import http.client
from datetime import datetime
import time
import os
import threading

config = ConfigReader("config.json")

class CameraInterface(SensorInterface):
    def __init__(self, logger):
        self.logger=logger
        # Read configuration from config.json
        camera_config=config.get("camera")
       
        # Set camera frame properties
        self.frame_width = camera_config.get("frameWidth")
        self.frame_height = camera_config.get("frameHeight")
        self.fps = camera_config.get("fps")

        # Get the vehicle name from the configuration
        self.car = config.get("vehiclename")

        # Set the camera configuration string for GStreamer
        self.cam_config = f"v4l2src device=/dev/video0 ! video/x-raw, format=NV12, framerate={self.fps}/1, width={self.frame_width}, height={self.frame_height}, dmabuf-import=true ! videoconvert ! video/x-raw, format=BGRx ! videoconvert ! video/x-raw, format=BGR ! appsink"        

        # Initialize the camera capture
        self.cam = cv2.VideoCapture(self.cam_config, cv2.CAP_GSTREAMER)

    def start(self):
        # Read configuration from config.json
        config = ConfigReader("config.json")

        # Set the streaming flag
        self.streaming = 1
        self.logger.info("Cam Started")

    def initialize_capture(self):
        # If the camera is already open, release it
        if self.cam is not None:
            self.cam.release()

        # Re-initialize the camera capture
        self.cam = cv2.VideoCapture(self.cam_config, cv2.CAP_GSTREAMER)

    def read(self):
        try:
            # Read a frame from the camera
            ret, frame = self.cam.read()
            # Encode the frame as a JPEG image
            if frame is not None:
                image = cv2.imencode(".jpg", frame)[1].tobytes()
                return image
            else:
                return None
        except Exception as e:
            self.logger.error("Error reading from camera", e)
        return None

    def stop(self):
        # If the camera is open, release it
        if self.cam is not None:
            self.cam.release()
            self.cam = None
            self.streaming = 0
        self.logger.info("Cam Released")