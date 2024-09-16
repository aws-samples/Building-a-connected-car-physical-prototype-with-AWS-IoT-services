from awscrt import mqtt, http
from awsiot import mqtt_connection_builder, iotshadow
from datetime import datetime

from ConfigReader import ConfigReader
import requests

import sys
import json

SHADOW_VALUE_DEFAULT = False


class Cloud:
    def __init__(self, logger=None):
        now = datetime.now()  # current date and time

        config = ConfigReader("config.json")
        self.endpoint = config.get("endpoint")
        self.ca = config.get("ca")
        self.privatekey = config.get("privatekey")
        self.certificate = config.get("certificate")
        self.vehiclename = config.get("vehiclename")
        self.shadow_properties = ["GreenLed", "RedLed"]

        # Generate unique client ID
        self.client_id = self.vehiclename + "-SH"

        # Classic shadow
        self.shadow_thing_name = self.vehiclename

    # Callback when connection is accidentally lost.
    def on_connection_interrupted(self, connection, error, **kwargs):
        print("Connection interrupted. error: {}".format(error))

    # Callback when an interrupted connection is re-established.
    def on_connection_resumed(self, connection, return_code, session_present, **kwargs):
        print(
            "Connection resumed. return_code: {} session_present: {}".format(
                return_code, session_present
            )
        )

        if return_code == mqtt.ConnectReturnCode.ACCEPTED and not session_present:
            print("Session did not persist. Resubscribing to existing topics...")
            resubscribe_future, _ = connection.resubscribe_existing_topics()

            # Cannot synchronously wait for resubscribe result because we're on the connection's event-loop thread,
            # evaluate result with a callback instead.
            resubscribe_future.add_done_callback(self.on_resubscribe_complete)

    def on_resubscribe_complete(self, resubscribe_future):
        resubscribe_results = resubscribe_future.result()
        print("Resubscribe results: {}".format(resubscribe_results))

        for topic, qos in resubscribe_results["topics"]:
            if qos is None:
                sys.exit("Server rejected resubscribe to topic: {}".format(topic))

    # Callback when the connection successfully connects
    def on_connection_success(self, connection, callback_data):
        print(
            "Connection Successful with return code: {} session present: {}".format(
                callback_data.return_code, callback_data.session_present
            )
        )

    # Callback when a connection attempt fails
    def on_connection_failure(self, connection, callback_data):
        print("Connection failed with error code: {}".format(callback_data.error))

    # Callback when a connection has been disconnected or shutdown successfully
    def on_connection_closed(self, connection, callback_data):
        print("Connection closed")

    def connect(self, set_led_fuction):
        self.set_led = set_led_fuction
        self.mqtt_connection = mqtt_connection_builder.mtls_from_path(
            endpoint=self.endpoint,
            cert_filepath=self.certificate,
            pri_key_filepath=self.privatekey,
            ca_filepath=self.ca,
            client_id=self.client_id,
            on_connection_interrupted=self.on_connection_interrupted,
            on_connection_resumed=self.on_connection_resumed,
            clean_session=True,
            keep_alive_secs=30,
            on_connection_success=self.on_connection_success,
            on_connection_failure=self.on_connection_failure,
            on_connection_closed=self.on_connection_closed,
        )


        print(f"Connecting to {self.endpoint} with client ID '{self.client_id}'...")

        connect_future = self.mqtt_connection.connect()
        self.shadow_client = iotshadow.IotShadowClient(self.mqtt_connection)

        # Future.result() waits until a result is available
        connect_future.result()
        print("Connected!")

        # (1) The Device establishes an MQTT connection to the AWS IoT Core endpoint and then subscribes to the reserved MQTT shadow topics to get and update shadow event operations.

        print("Subscribing to Update responses...")
        update_accepted_subscribed_future, _ = (
            self.shadow_client.subscribe_to_update_shadow_accepted(
                request=iotshadow.UpdateShadowSubscriptionRequest(
                    thing_name=self.shadow_thing_name
                ),
                qos=mqtt.QoS.AT_LEAST_ONCE,
                callback=self.on_update_shadow_accepted,
            )
        )

        update_rejected_subscribed_future, _ = (
            self.shadow_client.subscribe_to_update_shadow_rejected(
                request=iotshadow.UpdateShadowSubscriptionRequest(
                    thing_name=self.shadow_thing_name
                ),
                qos=mqtt.QoS.AT_LEAST_ONCE,
                callback=self.on_update_shadow_rejected,
            )
        )

        # Wait for subscriptions to succeed
        update_accepted_subscribed_future.result()
        update_rejected_subscribed_future.result()

        print("Subscribing to Get responses...")
        get_accepted_subscribed_future, _ = (
            self.shadow_client.subscribe_to_get_shadow_accepted(
                request=iotshadow.GetShadowSubscriptionRequest(
                    thing_name=self.shadow_thing_name
                ),
                qos=mqtt.QoS.AT_LEAST_ONCE,
                callback=self.on_get_shadow_accepted,
            )
        )

        get_rejected_subscribed_future, _ = (
            self.shadow_client.subscribe_to_get_shadow_rejected(
                request=iotshadow.GetShadowSubscriptionRequest(
                    thing_name=self.shadow_thing_name
                ),
                qos=mqtt.QoS.AT_LEAST_ONCE,
                callback=self.on_get_shadow_rejected,
            )
        )

        # Wait for subscriptions to succeed
        get_accepted_subscribed_future.result()
        get_rejected_subscribed_future.result()

        print("Subscribing to Delta events...")
        delta_subscribed_future, _ = (
            self.shadow_client.subscribe_to_shadow_delta_updated_events(
                request=iotshadow.ShadowDeltaUpdatedSubscriptionRequest(
                    thing_name=self.shadow_thing_name
                ),
                qos=mqtt.QoS.AT_LEAST_ONCE,
                callback=self.on_shadow_delta_updated,
            )
        )

        # Wait for subscription to succeed
        delta_subscribed_future.result()

        # (2) After successfully connecting and topic subscription, the Device publishes a request to ShadowTopicPrefix/get topic

        print("Requesting current shadow state...")

        publish_get_future = self.shadow_client.publish_get_shadow(
            request=iotshadow.GetShadowRequest(thing_name=self.shadow_thing_name),
            qos=mqtt.QoS.AT_LEAST_ONCE,
        )

        publish_get_future.result()

    # Subscribe to Update Shadow responses

    def set_local_value(self, shadow_property, value):
        # Qui il nuovo valore viene settato sul device
        if shadow_property in ["RedLed", "GreenLed"]:
            print("Setting")
            if hasattr (self, "set_led"):
                payload = json.dumps({"led": shadow_property, "status": value})
                print("Set local value")
                self.set_led(payload)

    # (3b) The Device publish status on ShadowTopicPrefix/update topic for reconciliation of reported state on shadow document.

    def change_shadow_value(self, property, value, type):
        print(f"Updating reported shadow {property} value to {value}")
        if type == "all":
            request = iotshadow.UpdateShadowRequest(
                thing_name=self.shadow_thing_name,
                state=iotshadow.ShadowState(
                    reported={property: value},
                    desired={property: value},
                ),
            )
        else:
            request = iotshadow.UpdateShadowRequest(
                thing_name=self.shadow_thing_name,
                state=iotshadow.ShadowState(**{type: {property: value}}),
            )

        future = self.shadow_client.publish_update_shadow(
            request, mqtt.QoS.AT_LEAST_ONCE
        )

    def on_update_shadow_accepted(self, response):
        print("Update Shadow Accepted: ")
        print(response)

    def on_update_shadow_rejected(self, response):
        print("Update Shadow Rejected: ")
        print(response)

    # (3a) Process the latest shadow document received on the ShadowTopicPrefix/get/accepted topic.

    def on_get_shadow_accepted(self, response):
        print("Get Shadow Accepted: ")
        if response.state:
            if response.state.delta:
                for shadow_property in self.shadow_properties:
                    value = response.state.delta.get(shadow_property)
                    if value is not None:
                        print(
                            f"Shadow property {shadow_property} contains delta value '{value}'."
                        )
                        self.change_shadow_value(shadow_property, value, "reported")
            elif response.state.reported:
                for shadow_property in self.shadow_properties:
                    value = response.state.reported.get(shadow_property)
                    if value is not None:
                        print(
                            f"Shadow property {shadow_property} contains reported value '{value}'."
                        )
                        self.set_local_value(
                            shadow_property, response.state.reported[shadow_property]
                        )

    def on_get_shadow_rejected(response):
        print("Get Shadow Rejected: ")
        print(response)

    # (4) After processing, delta attributes on initial connect/reconnect. If the device optionally remains connected, it can further receive delta changes on the shadow document from the Client Application.

    def on_shadow_delta_updated(self, delta):
        print("Shadow Delta Updated: ")
        print(delta)
        for shadow_property in self.shadow_properties:
            print("Received shadow delta event.")
            if delta.state and (shadow_property in delta.state):
                value = delta.state[shadow_property]
                if value is None:
                    print(
                        "Delta reports that '{}' was deleted. Resetting defaults...".format(
                            shadow_property
                        )
                    )
                    self.change_shadow_value(
                        shadow_property, SHADOW_VALUE_DEFAULT, "reported"
                    )
                    self.set_local_value(shadow_property, value)
                    return
                else:
                    print(
                        f"Delta reports that property {shadow_property} desired value is '{value}'. Changing local value..."
                    )
                    self.change_shadow_value(shadow_property, value, "reported")
                    self.set_local_value(shadow_property, value)

            else:
                print("  Delta did not report a change in '{}'".format(shadow_property))

    def disconnect(self):
        print("Disconnecting... MQTT")
        disconnect_future = self.mqtt_connection.disconnect()
        disconnect_future.result()
        print("Disconnected!")
