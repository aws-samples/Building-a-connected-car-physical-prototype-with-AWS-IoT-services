import pygame
import socketio
from enum import Enum
import json
import os

from ConfigReader import ConfigReader


class Joystick():

  def __init__(self):
    config = ConfigReader('config.json')
    controller = config.get('controller')
    with open(os.path.join("Joystick/"+controller+".json"), 'r+') as file:
      self.button_keys = json.load(file)
      ################################# LOAD UP A BASIC WINDOW #################################
    self.LEFT = False
    self.RIGHT = False
    self.UP = False
    self.DOWN = False
    self.LEFT_CAMERA = False
    self.RIGHT_CAMERA = False
    self.UP_CAMERA = False
    self.DOWN_CAMERA = False
    self.SPEED=0
    self.MAX_SPEED=100
    self.ANALOG_KEYS = {0:0, 1:0, 2:0, 3:0, 4:-1, 5: -1 }

    pygame.init()
    self.joystick = pygame.joystick.Joystick(0) 
    self.joystick.init()

  def handle_events(self, events):
    for event in events:
      if event.type == pygame.JOYBUTTONDOWN:
         self.handle_button_event(event)
      elif event.type == pygame.JOYAXISMOTION:  
         self.handle_axis_event(event)

  def handle_button_event(self, event):
    button = self.button_keys['controls'][str(event.button)]
    button_action = button['action']
    button_type= button['type']
    print(button)
    if button_type == "led":
        sio.emit("ledController", json.dumps({"led":button_action}))
    if button_type == "reko":

        sio.emit("detectController", json.dumps({"action":button_action}))

  def handle_axis_event(self, event):
    self.ANALOG_KEYS[event.axis] = event.value
    if abs(self.ANALOG_KEYS[0]) > .4:
        if self.ANALOG_KEYS[0] < -.9:
            if not self.LEFT:
                sio.emit('move', 'right')
            self.LEFT = True
        else:
            if self.LEFT:
                sio.emit('move', 'stop')
            self.LEFT = False
        if self.ANALOG_KEYS[0] > .9:
            if not self.RIGHT:
                sio.emit('move', 'left')     
            self.RIGHT = True
        else:
            if self.RIGHT:
                sio.emit('move', 'stop')
            self.RIGHT = False
    else:
        if self.RIGHT or self.LEFT :
            self.RIGHT = False
            self.LEFT = False
            sio.emit('move', 'stop')
    # Vertical Analog
    if abs(self.ANALOG_KEYS[1]) > .4:
        if self.ANALOG_KEYS[1] < -.9:
            if not self.UP:
                sio.emit('move', 'down')   
            self.UP = True
        else:
            if  self.UP:
                sio.emit('move', 'stop')                    
            self.UP = False
        if self.ANALOG_KEYS[1] > .9:
            if not self.DOWN:
                sio.emit('move', 'up') 
            self.DOWN = True
        else:
            if self.DOWN:
                sio.emit('move', 'stop')   
            self.DOWN = False
    else:
        if self.UP or self.DOWN :
            self.UP = False
            self.DOWN = False
            sio.emit('move', 'stop')
    #Move Camera
    if abs(self.ANALOG_KEYS[3]) > .4:
        if self.ANALOG_KEYS[3] < -.9:
            if not self.LEFT_CAMERA:
                sio.emit('head', 'right')
            self.LEFT_CAMERA = True
        else:
            if self.LEFT_CAMERA:
                sio.emit('head', 'stop')
            self.LEFT_CAMERA = False
        if self.ANALOG_KEYS[3] > .9:
            if not self.RIGHT_CAMERA:
                sio.emit('head', 'left')     
            self.RIGHT_CAMERA = True
        else:
            if self.RIGHT_CAMERA:
                sio.emit('head', 'stop')
            self.RIGHT_CAMERA = False

    # Move Camera Vertical Analog
    if abs(self.ANALOG_KEYS[4]) > .4:
        if self.ANALOG_KEYS[4] < -.9:
            if not self.UP_CAMERA:
                sio.emit('head', 'up')   
            self.UP_CAMERA = True
        else:
            if  self.UP_CAMERA:
                sio.emit('head', 'stop')                    
            self.UP_CAMERA = False
        if self.ANALOG_KEYS[4] > .9:
            if not self.DOWN_CAMERA:
                sio.emit('head', 'down') 
            self.DOWN_CAMERA = True
        else:
            if self.DOWN_CAMERA:
                sio.emit('head', 'stop')   
            self.DOWN_CAMERA = False                    
        # Triggers
    if self.ANALOG_KEYS[5] > .3:
        # Calculate New Speed
        NEW_SPEED=min(round(self.ANALOG_KEYS[5]*100,-1), self.MAX_SPEED)
        if self.SPEED!=NEW_SPEED:
            self.SPEED=NEW_SPEED
            sio.emit('speed', self.SPEED)
    else:
        if self.SPEED>0:
            self.SPEED=0
            sio.emit('speed', self.SPEED)

  def loop(self):
    while running:
      events = pygame.event.get()
      self.handle_events(events)

if __name__ == '__main__':
  try:
    sio = socketio.SimpleClient()
    sio.connect('http://localhost:5000')
    running = True
    joystick = Joystick()
    joystick.loop()
  except KeyboardInterrupt:
    running = False