from awscrt import mqtt, http
from awsiot import mqtt_connection_builder, iotshadow
from datetime import datetime
from uuid import uuid4
from Comm.comms import CommInterface

from ConfigReader import ConfigReader

import sys
import json

class CloudInterface(CommInterface):
  def __init__(self):
    now = datetime.now() # current date and time

    config = ConfigReader('config.json')
    self.endpoint = config.get('endpoint')
    self.ca = config.get('ca')
    self.privatekey = config.get('privatekey')
    self.certificate = config.get('certificate')
    self.vehiclename = config.get('vehiclename')
    self.shadow_properties = ["RedLed", "GreenLed"]

    # Generate unique client ID  
    #self.client_id = self.vehiclename + '_sh'   
    self.client_id = self.vehiclename   

    # Classic shadow
    self.shadow_thing_name = self.client_id

    self.connect()

  # Callback when connection is accidentally lost.
  def on_connection_interrupted(self,connection, error, **kwargs):
      print("Connection interrupted. error: {}".format(error))

  # Callback when an interrupted connection is re-established.
  def on_connection_resumed(self,connection, return_code, session_present, **kwargs):
      print("Connection resumed. return_code: {} session_present: {}".format(return_code, session_present))

      if return_code == mqtt.ConnectReturnCode.ACCEPTED and not session_present:
          print("Session did not persist. Resubscribing to existing topics...")
          resubscribe_future, _ = connection.resubscribe_existing_topics()

          # Cannot synchronously wait for resubscribe result because we're on the connection's event-loop thread,
          # evaluate result with a callback instead.
          resubscribe_future.add_done_callback(self.on_resubscribe_complete)


  def on_resubscribe_complete(self,resubscribe_future):
      resubscribe_results = resubscribe_future.result()
      print("Resubscribe results: {}".format(resubscribe_results))

      for topic, qos in resubscribe_results['topics']:
          if qos is None:
              sys.exit("Server rejected resubscribe to topic: {}".format(topic))

  # Callback when the subscribed topic receives a message
  def on_message_received(self,topic, payload, dup, qos, retain, **kwargs):
      print("Received message from topic '{}': {}".format(topic, payload))

  # Callback when the connection successfully connects
  def on_connection_success(self,connection, callback_data):
      print("Connection Successful with return code: {} session present: {}".format(callback_data.return_code, callback_data.session_present))

  # Callback when a connection attempt fails
  def on_connection_failure(self,connection, callback_data):
      print("Connection failed with error code: {}".format(callback_data.error))

  # Callback when a connection has been disconnected or shutdown successfully
  def on_connection_closed(self,connection, callback_data):
      print("Connection closed")

  def connect(self):
      self.mqtt_connection = mqtt_connection_builder.mtls_from_path(
          endpoint=self.endpoint,
          cert_filepath=self.certificate,
          pri_key_filepath=self.privatekey,
          ca_filepath=self.ca,
          client_id=self.client_id,
          on_connection_interrupted=self.on_connection_interrupted,
          on_connection_resumed=self.on_connection_resumed,
          clean_session=False,
          keep_alive_secs=30,
          on_connection_success=self.on_connection_success,
          on_connection_failure=self.on_connection_failure,
          on_connection_closed=self.on_connection_closed)

      print(f"Connecting to {self.endpoint} with client ID '{self.client_id}'...")

      connect_future = self.mqtt_connection.connect()
      self.shadow_client = iotshadow.IotShadowClient(self.mqtt_connection)
      # Future.result() waits until a result is available
      connect_future.result()
      print("Connected!")

      # Shadow helpers

      def set_local_value_due(property, reported_value):
         print("set_local_value_due")
         print(f"Init: Va settato il led {property} al valore {reported_value} ")

      # Shadow callbacks

      def on_update_shadow_accepted(response):
          print("Update Shadow Accepted: ")
          print(response)

      def on_update_shadow_rejected(response):
          print("Update Shadow Rejected: ")
          print(response)
          
      def on_get_shadow_accepted(response):
          print("Get Shadow Accepted: ")
          print(response)
          for shadow_property in self.shadow_properties:
            if response.state:
              if response.state.delta:
                value = response.state.delta.get(shadow_property)
                if value:
                  print(f"Shadow property {shadow_property} contains delta value '{value}'.")
                  change_shadow_value(shadow_property, value)
                  return

              if response.state.reported:
                value = response.state.reported.get(shadow_property)
                if value:
                  print(f"Shadow property {shadow_property} contains reported value '{value}'.")
                  set_local_value_due(shadow_property, response.state.reported[shadow_property])
                  return

            print("Shadow document lacks '{}' property. Setting defaults...".format(shadow_property))
            #change_shadow_value(SHADOW_VALUE_DEFAULT)
      
      def on_get_shadow_rejected(response):
          print("Get Shadow Rejected: ")
          print(response)

      def on_shadow_delta_updated(delta):
            print("Shadow Delta Updated: ")
            print(delta)
            try:
              for shadow_property in self.shadow_properties:
                print("Received shadow delta event.")
                if delta.state and (shadow_property in delta.state):
                    value = delta.state[shadow_property]
                    if value is None:
                        print("Delta reports that '{}' was deleted. Resetting defaults...".format(shadow_property))
                        #change_shadow_value(SHADOW_VALUE_DEFAULT)
                        return
                    else:
                        print(f"Delta reports that property {shadow_property} desired value is '{value}'. Changing local value...")
                        set_local_value_due(shadow_property, value)
                else:
                    print("  Delta did not report a change in '{}'".format(shadow_property))

            except Exception as e:
              exit(e)

      try:
        # Subscribe to Update Shadow responses

        print("Subscribing to Update responses...")
        update_accepted_subscribed_future, _ = self.shadow_client.subscribe_to_update_shadow_accepted(
            request=iotshadow.UpdateShadowSubscriptionRequest(thing_name=self.shadow_thing_name),
            qos=mqtt.QoS.AT_LEAST_ONCE,
            callback=on_update_shadow_accepted)

        update_rejected_subscribed_future, _ = self.shadow_client.subscribe_to_update_shadow_rejected(
            request=iotshadow.UpdateShadowSubscriptionRequest(thing_name=self.shadow_thing_name),
            qos=mqtt.QoS.AT_LEAST_ONCE,
            callback=on_update_shadow_rejected)
        
        # Wait for subscriptions to succeed
        update_accepted_subscribed_future.result()
        update_rejected_subscribed_future.result()

        print("Subscribing to Get responses...")
        get_accepted_subscribed_future, _ = self.shadow_client.subscribe_to_get_shadow_accepted(
            request=iotshadow.GetShadowSubscriptionRequest(thing_name=self.shadow_thing_name),
            qos=mqtt.QoS.AT_LEAST_ONCE,
            callback=on_get_shadow_accepted)

        get_rejected_subscribed_future, _ = self.shadow_client.subscribe_to_get_shadow_rejected(
            request=iotshadow.GetShadowSubscriptionRequest(thing_name=self.shadow_thing_name),
            qos=mqtt.QoS.AT_LEAST_ONCE,
            callback=on_get_shadow_rejected)

        # Wait for subscriptions to succeed
        get_accepted_subscribed_future.result()
        get_rejected_subscribed_future.result()

        print("Subscribing to Delta events...")
        delta_subscribed_future, _ = self.shadow_client.subscribe_to_shadow_delta_updated_events(
            request=iotshadow.ShadowDeltaUpdatedSubscriptionRequest(thing_name=self.shadow_thing_name),
            qos=mqtt.QoS.AT_LEAST_ONCE,
            callback=on_shadow_delta_updated)

        # Wait for subscription to succeed
        delta_subscribed_future.result()
      
        print("Requesting current shadow state...")

        publish_get_future = self.shadow_client.publish_get_shadow(
                request=iotshadow.GetShadowRequest(thing_name=self.shadow_thing_name),
                qos=mqtt.QoS.AT_LEAST_ONCE)

        publish_get_future.result()
        
      except Exception as e:
        exit(e)
        
  def disconnect(self):
      print("Disconnecting...")
      disconnect_future = self.mqtt_connection.disconnect()
      disconnect_future.result()
      print("Disconnected!")

  def publish(self, topic, message):
      print("Publishing to topic '{}'...".format(topic))
      print(message)
      self.mqtt_connection.publish(
        topic=topic,
        payload=message,
        qos=mqtt.QoS.AT_LEAST_ONCE)
      
  def subscribe(self, topic):
      print("Subscribing to topic '{}'...".format(topic))
      subscribe_future, packet_id = self.mqtt_connection.subscribe(
          topic=topic,
          qos=mqtt.QoS.AT_LEAST_ONCE,
          callback=self.on_message_received)

      subscribe_result = subscribe_future.result()
      print("Subscribed with {}".format(str(subscribe_result['qos'])))
  
  # Called by app.py when a Led is changed
  def change_shadow_value(self, property, value):
    print("change_shadow_value")
    if value == "none":
        value = None

    request = iotshadow.UpdateShadowRequest(
      thing_name=self.shadow_thing_name,
        state=iotshadow.ShadowState(
            reported={property: value},
            desired={property: value},
        )
    )

    future = self.shadow_client.publish_update_shadow(request, mqtt.QoS.AT_LEAST_ONCE)
    print(f"Init: Va settato il led {property} al valore {value} ")
