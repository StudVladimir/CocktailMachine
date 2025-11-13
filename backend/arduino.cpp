#include <WiFiNINA.h>
#include <PubSubClient.h>

// WiFi credentials
const char* ssid = "Xamklab";
const char* password = "studentXAMK";

// MQTT broker
const char* mqtt_server = "172.20.53.121"; // change if needed
const int mqtt_port = 1883;
const char* mqtt_user = "student";
const char* mqtt_pass = "student";

WiFiClient espClient;
PubSubClient client(espClient);

String deviceId = "CockTailArduino";

void mqttCallback(char* topic, byte* payload, unsigned int length) {
    // no logic needed for now
}

bool mqttConnect() {
    if (client.connected()) return true;

    // availability topic (used for LWT and state)
    String availTopic = String("Group5/") + deviceId + "/availability";

    // Use connect overload to set a Last Will (will message) so Home Assistant sees 'offline' when device drops
    // PubSubClient::connect(clientId, user, pass, willTopic, willQos, willRetain, willMessage)
    bool ok = client.connect(deviceId.c_str(), mqtt_user, mqtt_pass,
                                                        availTopic.c_str(), 1, true, "offline");
    if (ok) {
        Serial.println("MQTT connected");
        // Publish retained 'online' so HA knows we're online
        client.publish(availTopic.c_str(), "online", true);

        // Publish a simple non-retained message to indicate device connected
        String msgTopic = String("Group5/") + deviceId + "/message";
        client.publish(msgTopic.c_str(), "hello from device", false);
    } else {
        Serial.print("Failed to connect MQTT, state=");
        Serial.println(client.state());
    }
    return ok;
}

unsigned long lastHeartbeat = 0;

void setup() {
    Serial.begin(115200);
    delay(100);

    Serial.print("Connecting to Wi-Fi: ");
    Serial.println(ssid);
    WiFi.begin(ssid, password);
    int retry = 0;
    while (WiFi.status() != WL_CONNECTED && retry < 60) {
        delay(500);
        Serial.print('.');
        retry++;
    }
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWi-Fi connected");
        Serial.print("IP: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("\nWi-Fi connection failed");
    }

    // create a deviceId from MAC suffix
    uint8_t mac[6];
    WiFi.macAddress(mac);
    char idbuf[32];
    snprintf(idbuf, sizeof(idbuf), "bar_%02X%02X%02X", mac[3], mac[4], mac[5]);
    deviceId = String(idbuf);
    Serial.print("DeviceId: "); Serial.println(deviceId);

    client.setServer(mqtt_server, mqtt_port);
    client.setCallback(mqttCallback);

    mqttConnect();
}

void loop() {
    if (!client.connected()) {
        mqttConnect();
    }
    client.loop();

    // periodic heartbeat (re-publish retained online so HA keeps seeing the device)
    if (millis() - lastHeartbeat > 30000) {
        String availTopic = String("Group5/") + deviceId + "/availability";
        client.publish(availTopic.c_str(), "online", true);
        lastHeartbeat = millis();
    }
}