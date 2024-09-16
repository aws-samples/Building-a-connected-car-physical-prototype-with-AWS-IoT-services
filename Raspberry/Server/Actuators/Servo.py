from Actuators.PCA9685 import PCA9685
import sys
from Actuators.actuators import ActuatorInterface

#There are 2 parameters. The first one is related to servo index.The second one is related to the angle of servos. For example, setServoPwm(‘0’,20) makes servo0 rotate to 20°. setServoPwm(‘1’,90) makes servo1 rotate to 90°.#

# https://learn.sparkfun.com/tutorials/hobby-servo-tutorial/all
# https://www.instructables.com/Pan-Tilt-Multi-Servo-Control/

class ServoInterface(ActuatorInterface):
    def __init__(self):
        self.PwmServo = PCA9685(0x40, debug=True)
        self.PwmServo.setPWMFreq(50)
        self.PwmServo.setServoPulse(8,1500)
        self.PwmServo.setServoPulse(9,1500)
    
    def setServoPwm(self,channel,angle,error=10):
        angle=int(angle)
        if channel=='0':
            self.PwmServo.setServoPulse(8,2500-int((angle+error)/0.09))
        elif channel=='1':
            self.PwmServo.setServoPulse(9,500+int((angle+error)/0.09))
        elif channel=='2':
            self.PwmServo.setServoPulse(10,500+int((angle+error)/0.09))
        elif channel=='3':
            self.PwmServo.setServoPulse(11,500+int((angle+error)/0.09))
        elif channel=='4':
            self.PwmServo.setServoPulse(12,500+int((angle+error)/0.09))
        elif channel=='5':
            self.PwmServo.setServoPulse(13,500+int((angle+error)/0.09))
        elif channel=='6':
            self.PwmServo.setServoPulse(14,500+int((angle+error)/0.09))
        elif channel=='7':
            self.PwmServo.setServoPulse(15,500+int((angle+error)/0.09))

    def read(self, value):
      pass
  
    def write(self, value):
      self.setServoPwm(value[0], value[1])
       



    
