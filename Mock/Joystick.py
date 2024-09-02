import pygame
import socketio
from enum import Enum
import json
import os

from ConfigReader import ConfigReader

toggle_red = False
toggle_green = False

class ButtonEvent(Enum):
  PRESSED = 1
  RELEASED = 2

class Button:
  def __init__(self, name, action):
    self.name = name 
    self.action = action

class Joystick():

  def __init__(self):
    config = ConfigReader('config.json')
    controller = config.get('controller')
    with open(os.path.join("Joystick/"+controller+".json"), 'r+') as file:
      self.button_keys = json.load(file)
    pygame.init()
    self.joystick = pygame.joystick.Joystick(0) 
    self.joystick.init()

  def handle_events(self, events):
    for event in events:
      if event.type == pygame.QUIT:
        running = False
      elif event.type == pygame.JOYBUTTONDOWN:
         self.handle_button_event(event)
      elif event.type == pygame.JOYAXISMOTION:  
         self.handle_axis_event(event)

  def handle_button_event(self, event):
    button = event.button 
    b = self.button_keys['controls']
    button_action = None
    
    if event.type == pygame.JOYBUTTONDOWN:
      button_action = ButtonEvent.PRESSED
      if (b[str(button)]['type'] == "led"):
        self.handle_led(b[str(button)]['action'])
      if (b[str(button)]['type'] == "head"):
        self.handle_head(b[str(button)]['action'])

    elif event.type == pygame.JOYBUTTONUP:  
      button_action = ButtonEvent.RELEASED
      
    if button_action:
      print(f"Button {button} {button_action}")

  def handle_led(self, color):
      def toggle_led(color):
        if color == 'red':
          global toggle_red
          toggle_red = not toggle_red
        else: 
          global toggle_green
          toggle_green = not toggle_green
      toggle_led(color)
      print(json.dumps({"led": 1,"status": int(toggle_red)}))
      print(json.dumps({"led": 2,"status": int(toggle_green)}))
      sio.emit("led", json.dumps(led['status']))

  def handle_head(self, direction):
    print("head: " + direction)
    sio.emit('head', direction)
    

  def handle_axis_event(self, event):

    def float_to_int(float_num):
      scaled = (float_num + 1) / 2 * 100
      return round(scaled)
  
    def get_movement_direction_x(value):
      if value <= -0.2:
        return "left"
      elif value >= 0.2:
        return "right"
      else:
        return "center"
    
    def get_movement_direction_y(value):
      if value <= -0.2:
        return "up"
      elif value >= 0.2:
        return "down"
      else:
        return "center"

    axis = event.axis
    value = event.value
    
    if axis == 5:
      print("speed: "+float_to_int(value))
      sio.emit('speed', float_to_int(value))
    
    if axis == 2:
      x = get_movement_direction_x(value) 
      print("move: " + x)
      sio.emit('move', x) 
  
    if axis == 3:
      y = get_movement_direction_y(value) 
      print("move: " + y)
      sio.emit('move', y) 

    if axis == 0:
      x = get_movement_direction_x(value) 
      print(x)
      sio.emit('head', x) 
  
    if axis == 1:
      y = get_movement_direction_y(value) 
      print(y)
      sio.emit('head', y) 

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