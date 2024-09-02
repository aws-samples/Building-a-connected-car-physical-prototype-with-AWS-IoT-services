import random

class MockADCInterface:
    def read(self, channel):
        # Return a mock value for ADC reading
        return random.uniform(3.02, 8.90)  

class MockMotorInterface:
    def write(self, values):
        # Print the values passed to the motor
        print(f"Motor values: {values}")

class MockUltrasonicInterface:
    def read(self):
        # Return a mock distance value
        return random.uniform(0.00, 10.00)  # Assuming a mock distance of 10.0 units

class MockLedInterface:
    def read(self, led_num):
        # Return a mock LED status
        #return random.randint(0, 1)  
        return 0

    def write(self, values):
        # Print the values passed to the LED
        print(f"LED values: {values}")

class MockServoInterface:
    def write(self, values):
        # Print the values passed to the servo
        print(f"Servo values: {values}")

class MockCloudInterface:
    def connect(self):
        # Print a mock connection message
        print("Cloud connected (mock)")

class MockCanInterface:
    def publish(self, signal, value):
        # Print a mock connection message
        #print(f"Publish on vcan0: {signal} = {value}")
        pass