# CocktailMachine 🍹

An automated cocktail making system built with React Native, Node.js backend, MQTT messaging, and Arduino-controlled pumps. The system allows users to browse available cocktails, assign ingredients to pumps, and automatically prepare drinks with precise measurements.

<p align="center">
  <img src="https://github.com/user-attachments/assets/7a1e9940-ce83-4cc4-9c8b-70549b7cdb7b" width="45%">
  <img src="https://github.com/user-attachments/assets/f66722ff-fbd6-459a-a9f7-7ac5cb17e849" width="45%">
</p>

## Table of Contents

- [Introduction](#introduction)
- [Quick Start](#quick-start)
- [Hardware + Environment](#hardware--environment)
- [IoT Part](#iot-part)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)

---

## Introduction

The CocktailMachine project is an IoT-enabled automated bartending system that combines mobile app control with physical hardware. Users can:

- **Browse Cocktails**: View available cocktail recipes based on assigned ingredients
- **Setup Pumps**: Drag-and-drop interface to assign drink components to physical pumps
- **Make Drinks**: Automatically dispense precise amounts of ingredients
- **Emergency Stop**: Immediately halt all pumps if needed
- **Multi-language Support**: Available in English, German, Finnish, Russian, Vietnamese, and Sinhala

The system uses MQTT for real-time communication between the mobile app, backend server, and Arduino-controlled hardware, ensuring reliable and responsive cocktail preparation.

---

## Quick Start

### Prerequisites

- **Node.js** (v14 or higher)
- **NoSQL DB** (running locally or remote instance)
- **MQTT Broker** (e.g., Mosquitto)
- **Arduino** with WiFiNINA library
- **Expo CLI** for React Native development
- **4 Relay modules** and **4 pumps** for hardware setup

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/StudVladimir/CocktailMachine.git
cd CocktailMachine
```

#### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
BACKEND_PORT=3000
MONGO_URL=mongodb://localhost:27017
DB_NAME=CocktailDB
MQTT_HOST=your_host
MQTT_PORT=1883
MQTT_USER=your_user
MQTT_PASS=your_pass
MQTT_BASE_TOPIC=CocktailMachine/App
```

Start the backend server:

```bash
npm start
```

The backend will run on `http://localhost:3000`

#### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Modify a `config.ts` file in `frontend/src/`:

```typescript
// Backend API configuration
// Change IP address to the address of your backend
export const API_URL = 'http://your_ip:3000/api';
```

Start the Expo development server:

```bash
npm start
```

Scan the QR code with Expo Go app (iOS/Android) or press `w` to run in web browser.

#### 4. Arduino Setup

- Upload `arduino.cpp` to your Arduino board with WiFiNINA support
- Update WiFi credentials and MQTT server IP in the code
- Connect relay modules to pins 3, 4, 5, 6
- Connect pumps to relay outputs

---

## Hardware + Environment

### System Architecture

The CocktailMachine uses a distributed architecture with four main components:

<img width="535" height="688" alt="Снимок экрана 2025-11-21 в 16 13 52" src="https://github.com/user-attachments/assets/dff95abc-23a4-4a77-8bb4-7b814c213bfd" />

### Communication Flow

#### 1. **Mobile App → Backend (HTTP/REST)**

The React Native app communicates with the Node.js backend via REST API for:
- Fetching cocktail recipes
- Retrieving ingredient components
- Checking MQTT connection status

**Example Flow:**
```
User opens app → GET /api/cocktails → Backend queries MongoDB → Returns cocktail list
User selects pumps → GET /api/cocktails/components → Returns available ingredients
```

#### 2. **Backend → MQTT Broker (MQTT Publish)**

When the user initiates cocktail preparation, the backend publishes messages to MQTT topics:

**Topic Structure:**
- **Cocktail Making**: `CocktailMachine/App/MakeCocktail`
- **Emergency Stop**: `CocktailMachine/App/EmergencyStop`
- **Device Status**: `CocktailMachine/bar_XXXXXX/status`
- **Device Availability**: `CocktailMachine/bar_XXXXXX/availability`

**Example: Making a Cocktail**

```javascript
// Backend publishes to MQTT
Topic: "CocktailMachine/App/MakeCocktail"
Payload: [
  { "pump": 1, "seconds": 3 },
  { "pump": 2, "seconds": 5 },
  { "pump": 3, "seconds": 2 }
]
```

#### 3. **Arduino ← MQTT Broker (MQTT Subscribe)**

The Arduino continuously listens to MQTT topics:

```cpp
// Arduino subscribes to topics
client.subscribe("CocktailMachine/App/MakeCocktail");
client.subscribe("CocktailMachine/App/EmergencyStop");

// When message arrives
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  if (String(topic) == "CocktailMachine/App/MakeCocktail") {
    // Parse JSON and activate pumps
    processCocktailInstructions(message);
  }
  else if (String(topic) == "CocktailMachine/App/EmergencyStop") {
    // Immediately stop all pumps
    emergencyStop();
  }
}
```

#### 4. **Arduino → Hardware (GPIO Control)**

Arduino controls relay modules via GPIO pins:

```cpp
// Pump control via relay pins
const int PUMP_PINS[4] = {3, 4, 5, 6};

// Turn pump ON
digitalWrite(PUMP_PINS[pumpIndex], LOW);  // LOW activates relay

// Turn pump OFF
digitalWrite(PUMP_PINS[pumpIndex], HIGH); // HIGH deactivates relay
```

**Non-blocking Operation:**
- Pumps run concurrently using timestamps
- `updatePumps()` checks elapsed time and automatically stops pumps
- Main loop continues to process MQTT messages during pump operation

#### 5. **Arduino → MQTT Broker (Status Updates)**

Arduino publishes status updates back to MQTT:

```cpp
// Availability (Last Will Testament)
Topic: "CocktailMachine/bar_XXXXXX/availability"
Payload: "online" or "offline"

// Cocktail completion
Topic: "CocktailMachine/bar_XXXXXX/status"
Payload: "cocktail_completed"

// Emergency stop confirmation
Topic: "CocktailMachine/bar_XXXXXX/status"
Payload: "emergency_stop_executed"
```

### Message Flow Example: Making a Cocktail

1. **User Action**: User selects "Jagerbomb" (200ml) and presses "Make"
2. **App Calculation**: 
   - Pump 1 (Jagermeister): 50ml → 5 seconds
   - Pump 4 (Energy drink): 100ml → 10 seconds
3. **HTTP Request**: 
   ```
   POST /api/makecocktail
   Body: [{"pump": 1, "seconds": 5}, {"pump": 4, "seconds": 10}]
   ```
4. **Backend → MQTT**: Publishes to `Group5/ReactNative/MakeCocktail`
5. **Arduino Receives**: Parses JSON and activates Pump 1 & 4 simultaneously
6. **Pumps Run**: Both pumps dispense for 5 and 10 seconds
7. **Auto-Stop**: `updatePumps()` turns off pumps after 5 and 10 seconds
8. **Status Update**: Arduino publishes "cocktail_completed" to MQTT
9. **User Notification**: App can display "Cocktail ready!" message

### Emergency Stop Flow

1. **User Action**: User presses "STOP" button
2. **HTTP Request**: `POST /api/makecocktail/stop`
3. **Backend → MQTT**: Publishes to `CocktailMachine/App/EmergencyStop`
4. **Arduino Receives**: Immediately executes `emergencyStop()`
5. **All Pumps OFF**: Sets all GPIO pins HIGH (relays OFF)
6. **Status Update**: Arduino confirms with "emergency_stop_executed"

### MQTT Quality of Service (QoS)

- **QoS 0**: Fire and forget (availability heartbeat)
- **QoS 1**: At least once delivery (cocktail commands, emergency stop)
- **Retained Messages**: Availability status persists for new subscribers

### Network Requirements

- All devices must be on the same network or have network routing configured
- MQTT broker must be accessible from all components
- Backend server must be reachable by mobile app
- MongoDB must be accessible by backend

---

## IoT Part

### Hardware Components

<p align="center">
  <img src="https://github.com/user-attachments/assets/8e59c253-6d56-46eb-8f65-a7c80bbf2de9" width="45%">
  <img src="https://github.com/user-attachments/assets/0c7eecf6-8b0f-4520-ae9f-e34d99f52429" width="45%">
</p>


**Components List:**
- Arduino board with WiFiNINA support
- 4x Relay modules (compatible with Arduino GPIO)
- 4x Peristaltic pumps or similar
- Power supply for pumps
- Connecting wires
- Breadboard or PCB for connections

**Pin Configuration:**
- Pin 3: Pump 1 Relay
- Pin 4: Pump 2 Relay
- Pin 5: Pump 3 Relay
- Pin 6: Pump 4 Relay

---

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Endpoints

#### 1. Health Check

**GET** `/api/message`

Returns a simple message to verify backend is running.

**Response:**
```json
{
  "message": "Hello from backend!"
}
```

---

#### 2. Get All Cocktails

**GET** `/api/cocktails`

Retrieves all available cocktail recipes from MongoDB. If the database is empty, it automatically imports data from `CockTails.json`.

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "Name": "Jagerbomb",
    "Ingredients": [
      { "Name": "Jagermeister", "Ratio": "50" },
      { "Name": "Energy drink", "Ratio": "50" }
    ],
    "Alchohol": true
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "Name": "Cola",
    "Ingredients": [
      { "Name": "Cola", "Ratio": "100" }
    ],
    "Alchohol": false
  }
]
```

**Status Codes:**
- `200 OK`: Successfully retrieved cocktails
- `500 Internal Server Error`: Database error

---

#### 3. Get All Components (Ingredients)

**GET** `/api/cocktails/components`

Retrieves all available drink components/ingredients from MongoDB. If the database is empty, it automatically imports data from `Components.json`.

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439021",
    "name": "Vodka",
    "type": "alcohol"
  },
  {
    "_id": "507f1f77bcf86cd799439022",
    "name": "Cola",
    "type": "mixer"
  },
  {
    "_id": "507f1f77bcf86cd799439023",
    "name": "Orange juice",
    "type": "juice"
  }
]
```

**Status Codes:**
- `200 OK`: Successfully retrieved components
- `500 Internal Server Error`: Database error

---

#### 4. Make Cocktail

**POST** `/api/makecocktail`

Sends pump instructions to Arduino via MQTT to prepare a cocktail. The payload specifies which pumps to activate and for how long.

**Request Body:**
```json
[
  { "pump": 1, "seconds": 10 },
  { "pump": 3, "seconds": 5 },
  { "pump": 4, "seconds": 8 }
]
```

**Parameters:**
- `pump` (number): Pump number (1-4)
- `seconds` (number): Duration to run pump in seconds

**Response:**
```json
{
  "ok": true,
  "topic": "CocktailMachine/App/MakeCocktail",
  "message": "[{\"pump\":1,\"seconds\":10},{\"pump\":3,\"seconds\":5}]"
}
```

**Status Codes:**
- `200 OK`: MQTT message published successfully
- `400 Bad Request`: Invalid payload format
- `500 Internal Server Error`: MQTT publish failed

**Validation:**
- Payload must be an array
- Each item must be an object with `pump` and `seconds` properties
- Both `pump` and `seconds` must be numbers

**MQTT Details:**
- **Topic**: `CocktailMachine/App/MakeCocktail`
- **QoS**: 1 (at least once delivery)
- **Payload**: JSON array of pump instructions

---

#### 5. Emergency Stop

**POST** `/api/makecocktail/stop`

Immediately stops all running pumps by sending an emergency stop command via MQTT.

**Request Body:** None required

**Response:**
```json
{
  "ok": true,
  "topic": "CocktailMachine/App/EmergencyStop",
  "message": "emergency stop"
}
```

**Status Codes:**
- `200 OK`: Emergency stop command sent successfully
- `500 Internal Server Error`: MQTT publish failed

**MQTT Details:**
- **Topic**: `CocktailMachine/App/EmergencyStop`
- **QoS**: 1 (at least once delivery)
- **Payload**: "emergency stop"

**Behavior:**
- Arduino receives message and immediately turns off all pumps
- All active pump timers are reset
- Arduino publishes confirmation to `CocktailMachine/bar_XXXXXX/status`

---

#### 6. MQTT Status

**GET** `/api/mqtt/status`

Checks the connection status of the backend's MQTT client.

**Response:**
```json
{
  "connected": true
}
```

**Status Codes:**
- `200 OK`: Always returns status

**Response Fields:**
- `connected` (boolean): `true` if MQTT client is connected, `false` otherwise

---

### Error Handling

All endpoints return error responses in the following format:

```json
{
  "error": "Error description message"
}
```

**Common Error Responses:**

- `400 Bad Request`: Invalid request format or parameters
  ```json
  { "error": "Payload must be an array" }
  ```

- `500 Internal Server Error`: Server or database errors
  ```json
  { "error": "Internal server error" }
  ```

---

### Environment Variables

The backend requires the following environment variables in `.env`:

```env
# Server Configuration
BACKEND_PORT=3000

# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=CocktailDB

# MQTT Configuration
MQTT_HOST=your_host_ip
MQTT_PORT=1883
MQTT_USER=your_user
MQTT_PASS=your_pass
MQTT_BASE_TOPIC=CocktailMachine/App
```

---

## Project Structure

```
CocktailMachine/
├── backend/
│   ├── index.js                 # Main backend server
│   ├── package.json             # Backend dependencies
│   ├── CockTails.json           # Cocktail recipes data
│   ├── Components.json          # Ingredients data
│   ├── arduino.cpp              # Arduino firmware code
│   └── routes/
│       ├── cocktails.js         # Cocktail endpoints
│       ├── components.js        # Components endpoints
│       └── mqtt.js              # MQTT publisher routes
├── frontend/
│   ├── App.tsx                  # Main app component
│   ├── index.ts                 # Entry point
│   ├── package.json             # Frontend dependencies
│   ├── tsconfig.json            # TypeScript config
│   └── src/
│       ├── config.ts            # API and MQTT configuration
│       ├── availableDrinks.ts   # Available drinks logic
│       ├── context/
│       │   └── PumpContext.tsx  # Pump state management
│       ├── localize/            # Multi-language support
│       │   ├── en.json
│       │   ├── de.json
│       │   ├── fin.json
│       │   ├── ru.json
│       │   ├── vie.json
│       │   ├── sin.json
│       │   └── string.ts
│       ├── requests/            # API request functions
│       │   ├── GetComponents.ts
│       │   ├── GetReceipts.ts
│       │   ├── MakeCockTails.ts
│       │   └── StopCockTails.ts
│       ├── screens/             # App screens
│       │   ├── Main.tsx
│       │   ├── PumpDialog.tsx
│       │   ├── PumpSetup.tsx
│       │   └── Card.tsx
│       ├── services/
│       │   ├── availableDrinks.ts
│       │   ├── calculatePumpInstructions.ts
│       │   └── setDrinkImg.ts
│       └── types/
│           ├── Component.ts
│           ├── PumpInstruction.ts
│           └── Receipt.ts
└── README.md
```

---

## Technologies Used

### Client
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **MQTT.js** - MQTT client library
- **dotenv** - Environment variable management
- **CORS** - Cross-origin resource sharing
- **React Native** - Mobile app framework
- **Expo** - React Native toolchain
- **TypeScript** - Type-safe JavaScript
- **React Navigation** - Navigation library
- **localized-strings** - Internationalization
- **MQTT.js** - MQTT client for real-time updates

### Hardware
- **Arduino** - Microcontroller platform
- **WiFiNINA** - WiFi library for Arduino
- **PubSubClient** - MQTT library for Arduino
- **ArduinoJson** - JSON parsing library

### Infrastructure
- **MQTT Broker** (Mosquitto) - Message broker
- **MongoDB** - Document database
- **WiFi Network** - Device connectivity

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## License

This project is licensed under the MIT License.

---

## Authors

- **Vladimir** - *Initial work* - [StudVladimir](https://github.com/StudVladimir)
