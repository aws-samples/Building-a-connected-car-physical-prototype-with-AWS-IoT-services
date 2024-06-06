import pygame
import json, os
import socketio
HOST = "172.20.10.12"  # The server's hostname or IP address
PORT = 5000  # The port used by the server


################################# LOAD UP A BASIC WINDOW #################################
pygame.init()

running = True
LEFT, RIGHT, UP, DOWN, LEFT_CAMERA, RIGHT_CAMERA, UP_CAMERA, DOWN_CAMERA = False, False, False, False, False, False, False, False
RED_LIGHT = {"led": 1,"status": False}
GREEN_LIGHT = {"led": 2,"status": False}
SPEED=0
MAX_SPEED=85
color = 0
###########################################################################################

#Initialize controller
joysticks = []
for i in range(pygame.joystick.get_count()):
    joysticks.append(pygame.joystick.Joystick(i))
for joystick in joysticks:
    joystick.init()

with open(os.path.join("ps4_keys.json"), 'r+') as file:
    button_keys = json.load(file)
# 0: Left analog horizonal, 1: Left Analog Vertical, 2: Right Analog Horizontal
# 3: Right Analog Vertical 4: Left Trigger, 5: Right Trigger
analog_keys = {0:0, 1:0, 2:0, 3:0, 4:-1, 5: -1 }

sio = socketio.Client()

@sio.event
def connect():
    print('connection established')

@sio.event
def my_message(data):
    print('message received with ', data)
    sio.emit('my response', {'response': 'my response'})

@sio.event
def disconnect():
    print('disconnected from server')

sio.connect('http://'+HOST+':5000')
# START OF GAME LOOP
while running:
    ################################# CHECK PLAYER INPUT #################################
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.KEYDOWN:
            ############### UPDATE SPRITE IF SPACE IS PRESSED #################################
            pass

        # HANDLES BUTTON PRESSES
        if event.type == pygame.JOYBUTTONDOWN:
            if event.button == button_keys['circle']:
                RED_LIGHT["status"]=not RED_LIGHT["status"]
                sio.emit("led", json.dumps(RED_LIGHT))
            if event.button == button_keys['square']:
                GREEN_LIGHT["status"]=not GREEN_LIGHT["status"]
                sio.emit("led", json.dumps(GREEN_LIGHT))
            if event.button == button_keys['left_arrow']:
                LEFT = True
            if event.button == button_keys['right_arrow']:
                RIGHT = True
            if event.button == button_keys['down_arrow']:
                DOWN = True
            if event.button == button_keys['up_arrow']:
                UP = True

        #HANDLES ANALOG INPUTS
        if event.type == pygame.JOYAXISMOTION:
            analog_keys[event.axis] = event.value
            # print(analog_keys)
            # Horizontal Analog
            if abs(analog_keys[0]) > .4:
                if analog_keys[0] < -.9:
                    if not LEFT:
                        sio.emit('move', 'right')
                    LEFT = True
                else:
                    if LEFT:
                        sio.emit('move', 'stop')
                    LEFT = False
                if analog_keys[0] > .9:
                    if not RIGHT:
                        sio.emit('move', 'left')     
                    RIGHT = True
                else:
                    if RIGHT:
                        sio.emit('move', 'stop')
                    RIGHT = False
            else:
                if RIGHT or LEFT :
                    RIGHT = False
                    LEFT = False
                    sio.emit('move', 'stop')
            # Vertical Analog
            if abs(analog_keys[1]) > .4:
                if analog_keys[1] < -.9:
                    if not UP:
                        sio.emit('move', 'down')   
                    UP = True
                else:
                    if  UP:
                        sio.emit('move', 'stop')                    
                    UP = False
                if analog_keys[1] > .9:
                    if not DOWN:
                        sio.emit('move', 'up') 
                    DOWN = True
                else:
                    if DOWN:
                        sio.emit('move', 'stop')   
                    DOWN = False
            else:
                if UP or DOWN :
                    UP = False
                    DOWN = False
                    sio.emit('move', 'stop')
                #Move Camera
            if abs(analog_keys[2]) > .4:
                if analog_keys[2] < -.9:
                    if not LEFT_CAMERA:
                        sio.emit('head', 'right')
                    LEFT_CAMERA = True
                else:
                    if LEFT_CAMERA:
                        sio.emit('head', 'stop')
                    LEFT_CAMERA = False
                if analog_keys[2] > .9:
                    if not RIGHT_CAMERA:
                        sio.emit('head', 'left')     
                    RIGHT_CAMERA = True
                else:
                    if RIGHT_CAMERA:
                        sio.emit('head', 'stop')
                    RIGHT_CAMERA = False

            # Move Camera Vertical Analog
            if abs(analog_keys[3]) > .4:
                if analog_keys[3] < -.9:
                    if not UP_CAMERA:
                        sio.emit('head', 'up')   
                    UP_CAMERA = True
                else:
                    if  UP_CAMERA:
                        sio.emit('head', 'stop')                    
                    UP_CAMERA = False
                if analog_keys[3] > .9:
                    if not DOWN_CAMERA:
                        sio.emit('head', 'down') 
                    DOWN_CAMERA = True
                else:
                    if DOWN_CAMERA:
                        sio.emit('head', 'stop')   
                    DOWN_CAMERA = False                    
                # Triggers
            if analog_keys[5] > .3:
                # Calculate New Speed
                NEW_SPEED=min(round(analog_keys[5]*100,-1), MAX_SPEED)
                if SPEED!=NEW_SPEED:
                    SPEED=NEW_SPEED
                    sio.emit('speed', SPEED)
            else:
                if SPEED>0:
                    SPEED=0
                    sio.emit('speed', SPEED)
            if analog_keys[4] > 0:  # Left trigger
                color += 2
            if analog_keys[5] > 0:  # Right Trigger
                color -= 2






  





