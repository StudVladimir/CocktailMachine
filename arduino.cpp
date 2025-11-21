#include <WiFiNINA.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "Xamklab";
const char* password = "studentXAMK";

// MQTT broker
const char* mqtt_server = "172.20.53.121"; // change if needed
const int mqtt_port = 1883;
const char* mqtt_user = "student";
const char* mqtt_pass = "student";

// Relay pins for pumps (pump 1-4 connected to pins 3-6)
const int PUMP_PINS[4] = {3, 4, 5, 6};
const int NUM_PUMPS = 4;

WiFiClient espClient;
PubSubClient client(espClient);

String deviceId = "CockTailArduino";
String cocktailTopic = "Group5/ReactNative/MakeCocktail";
String emergencyStopTopic = "Group5/ReactNative/EmergencyStop";

// Structure to track pump state
struct PumpState {
    bool active;
    unsigned long startTime;
    unsigned long duration;
};

PumpState pumpStates[4] = {{false, 0, 0}, {false, 0, 0}, {false, 0, 0}, {false, 0, 0}};
bool cocktailInProgress = false;
bool allPumpsWereActive = false;

// Function to start a pump (non-blocking)
void startPump(int pumpNumber, float seconds) {
    if (pumpNumber < 1 || pumpNumber > NUM_PUMPS) {
        Serial.print("Invalid pump number: ");
        Serial.println(pumpNumber);
        return;
    }

    int pinIndex = pumpNumber - 1;
    int pin = PUMP_PINS[pinIndex];
    unsigned long duration = (unsigned long)(seconds * 1000);

    Serial.print("Starting pump ");
    Serial.print(pumpNumber);
    Serial.print(" (pin ");
    Serial.print(pin);
    Serial.print(") for ");
    Serial.print(seconds);
    Serial.println(" seconds");

    // Turn on the pump
    digitalWrite(pin, LOW);
    
    // Record state
    pumpStates[pinIndex].active = true;
    pumpStates[pinIndex].startTime = millis();
    pumpStates[pinIndex].duration = duration;
}

// Function to update all pumps (check if they should be stopped)
void updatePumps() {
    bool anyActive = false;
    
    for (int i = 0; i < NUM_PUMPS; i++) {
        if (pumpStates[i].active) {
            anyActive = true;
            unsigned long elapsed = millis() - pumpStates[i].startTime;
            
            if (elapsed >= pumpStates[i].duration) {
                // Time is up, turn off pump
                digitalWrite(PUMP_PINS[i], HIGH);
                pumpStates[i].active = false;
                
                Serial.print("Pump ");
                Serial.print(i + 1);
                Serial.println(" finished");
            }
        }
    }
    
    // Check if all pumps just finished
    if (allPumpsWereActive && !anyActive && cocktailInProgress) {
        Serial.println("All pumps finished!");
        
        // Send completion message back to MQTT
        String statusTopic = String("Group5/") + deviceId + "/status";
        client.publish(statusTopic.c_str(), "cocktail_completed", false);
        
        cocktailInProgress = false;
        allPumpsWereActive = false;
    }
    
    if (anyActive) {
        allPumpsWereActive = true;
    }
}

// Check if any pump is still running
bool anyPumpActive() {
    for (int i = 0; i < NUM_PUMPS; i++) {
        if (pumpStates[i].active) {
            return true;
        }
    }
    return false;
}

// Emergency stop - immediately turn off all pumps
void emergencyStop() {
    Serial.println("🛑 EMERGENCY STOP ACTIVATED!");
    
    // Turn off all pumps immediately
    for (int i = 0; i < NUM_PUMPS; i++) {
        digitalWrite(PUMP_PINS[i], HIGH);
        pumpStates[i].active = false;
        Serial.print("Pump ");
        Serial.print(i + 1);
        Serial.println(" stopped");
    }
    
    // Reset cocktail progress flags
    cocktailInProgress = false;
    allPumpsWereActive = false;
    
    Serial.println("All pumps stopped!");
    
    // Send status back to MQTT
    String statusTopic = String("Group5/") + deviceId + "/status";
    client.publish(statusTopic.c_str(), "emergency_stop_executed", false);
}

// Function to process cocktail instructions
void processCocktailInstructions(const char* jsonMessage) {
    Serial.println("Processing cocktail instructions...");
    Serial.print("Received JSON: ");
    Serial.println(jsonMessage);

    // Parse JSON array directly
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, jsonMessage);

    if (error) {
        Serial.print("JSON parsing failed: ");
        Serial.println(error.c_str());
        return;
    }

    // Check if it's an array
    if (!doc.is<JsonArray>()) {
        Serial.println("JSON is not an array");
        return;
    }

    // Process each pump instruction
    JsonArray instructions = doc.as<JsonArray>();
    Serial.print("Number of instructions: ");
    Serial.println(instructions.size());

    // Start all pumps simultaneously
    for (JsonObject instruction : instructions) {
        int pump = instruction["pump"];
        float seconds = instruction["seconds"];

        Serial.print("Instruction - Pump: ");
        Serial.print(pump);
        Serial.print(", Seconds: ");
        Serial.println(seconds);

        startPump(pump, seconds);
    }

    cocktailInProgress = true;
    Serial.println("All pumps started!");
    // Note: Pumps will be automatically stopped by updatePumps() in the main loop
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
    Serial.print("Message arrived [");
    Serial.print(topic);
    Serial.print("] ");

    // Convert payload to string
    char message[length + 1];
    for (unsigned int i = 0; i < length; i++) {
        message[i] = (char)payload[i];
    }
    message[length] = '\0';

    Serial.println(message);

    // Check if this is a cocktail making request
    if (String(topic) == cocktailTopic) {
        processCocktailInstructions(message);
    }
    // Check if this is an emergency stop request
    else if (String(topic) == emergencyStopTopic) {
        emergencyStop();
    }
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

        // Subscribe to cocktail making topic
        client.subscribe(cocktailTopic.c_str());
        Serial.print("Subscribed to topic: ");
        Serial.println(cocktailTopic);
        
        // Subscribe to emergency stop topic
        client.subscribe(emergencyStopTopic.c_str());
        Serial.print("Subscribed to emergency stop topic: ");
        Serial.println(emergencyStopTopic);

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

    // Initialize pump relay pins as outputs
    for (int i = 0; i < NUM_PUMPS; i++) {
        pinMode(PUMP_PINS[i], OUTPUT);
        digitalWrite(PUMP_PINS[i], HIGH); // Make sure all pumps are off initially
    }
    Serial.println("Pump pins initialized (pins 3-6)");

    // create a deviceId from MAC suffix (before WiFi connection)
    uint8_t mac[6];
    WiFi.macAddress(mac);
    char idbuf[32];
    snprintf(idbuf, sizeof(idbuf), "bar_%02X%02X%02X", mac[3], mac[4], mac[5]);
    deviceId = String(idbuf);
    Serial.print("DeviceId: "); Serial.println(deviceId);

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
        return; // Exit setup if WiFi failed
    }

    client.setServer(mqtt_server, mqtt_port);
    client.setCallback(mqttCallback);

    mqttConnect();
}

void loop() {
    if (!client.connected()) {
        mqttConnect();
    }
    client.loop();

    // Update pump states (turn off pumps when their time is up)
    updatePumps();

    // periodic heartbeat (re-publish retained online so HA keeps seeing the device)
    if (millis() - lastHeartbeat > 30000) {
        String availTopic = String("Group5/") + deviceId + "/availability";
        client.publish(availTopic.c_str(), "online", true);
        lastHeartbeat = millis();
    }
}