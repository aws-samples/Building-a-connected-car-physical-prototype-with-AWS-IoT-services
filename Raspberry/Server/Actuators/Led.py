import time
from rpi_ws281x import *
from Actuators.actuators import ActuatorInterface


# LED strip configuration:
LED_COUNT      = 8      # Number of LED pixels.
LED_PIN        = 18      # GPIO pin connected to the pixels (18 uses PWM!).
LED_FREQ_HZ    = 800000  # LED signal frequency in hertz (usually 800khz)
#When the LED cannot display normally, change the LED signal frequency to 110khz and try again
#LED_FREQ_HZ    = 1100000  # LED signal frequency in hertz (usually 110khz)
LED_DMA        = 10      # DMA channel to use for generating signal (try 10)
LED_BRIGHTNESS = 255     # Set to 0 for darkest and 255 for brightest
LED_INVERT     = False   # True to invert the signal (when using NPN transistor level shift)
LED_CHANNEL    = 0       # set to '1' for GPIOs 13, 19, 41, 45 or 53
# Define functions which animate LEDs in various ways.

class LedInterface(ActuatorInterface):
    def __init__(self):
        #Control the sending order of color data
        self.ORDER = "RGB"  
        # Create NeoPixel object with appropriate configuration.
        self.strip = Adafruit_NeoPixel(LED_COUNT, LED_PIN, LED_FREQ_HZ, LED_DMA, LED_INVERT, LED_BRIGHTNESS, LED_CHANNEL)
        # Intialize the library (must be called once before other functions).
        self.strip.begin()
    
    def LED_TYPR(self,order,R_G_B):
        B=R_G_B & 255
        G=R_G_B >> 8 & 255
        R=R_G_B >> 16 & 255 
        Led_type=["GRB","GBR","RGB", "RBG","BRG","BGR"]
        color = [Color(G,R,B),Color(G,B,R),Color(R,G,B),Color(R,B,G),Color(B,R,G),Color(B,G,R)]
        if order in Led_type:
            return color[Led_type.index(order)]

    def colorWipe(self,strip, color, wait_ms=50):
        #This function erases the color of one pixel at a time. It has three input parameters: strip represents the Neopixel object, color represents the color to be erased, and wait_ms represents the erasure interval. The default is 50ms. For example, colorWipe(strip, Color(255,0,0),20) means that the LED0 is red first, wait for 20ms, and then the LED1 is also red, until all eight LEDs are lit and red.
        """Wipe color across display a pixel at a time."""
        # led.colorWipe(led.strip, Color(255,0, 0)) RED
        # led.colorWipe(led.strip, Color(0,255, 0)) GREEN
        # led.colorWipe(led.strip, Color(0,0, 255)) BLUE
        color=self.LED_TYPR(self.ORDER,color)
        for i in range(self.strip.numPixels()):
            self.strip.setPixelColor(i, color)
            self.strip.show()
            time.sleep(wait_ms/1000.0)      

    def getPixelColor(self, pixel_index):
      # Check pixel index is valid
      if pixel_index < 0 or pixel_index >= self.strip.numPixels():
        raise IndexError("Pixel index out of range")

      # Get RGB color components from pixel  
      color = self.strip.getPixelColor(pixel_index)

      # Return color tuple
      return color
    
    def ledIndex(self,index,R,G,B):
        #This function has 4 parameters. The first one is the index of the LED that you want to control. Its value is hexadecimal. There are LED0~7. The rest 3 parameters are R G B value of color respectively. For example, ledindex(0x01,255,0,0) makes LED 0 light to red; ledeindex(0x40,0,255,0) makes LED 6 light green.
        color=self.LED_TYPR(self.ORDER, Color(R,G,B))
        for i in range(8):
            if index & 0x01 == 1:
                self.strip.setPixelColor(i,color)
                self.strip.show()
            index=index >> 1
    
    def read(self, value):
        led_color = self.getPixelColor(value)
        if led_color == Color(0,0,0):
          return 0
        else:
          return 1

    def write(self, value):
      self.ledIndex(value[0], value[1], value[2], value[3])

        
            
        
                    




   
