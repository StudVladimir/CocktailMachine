const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const app = express();
require('dotenv').config()
const PORT = process.env.BACKEND_PORT || 3000;

app.use(cors());
app.use(express.json());

// hello endpoint
app.get('/api/message', (req, res) => {
  res.json({ message: 'Hello from backend!' });
});

// MongoDB setup
const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME;

let mongoClient;
async function getCollection(collectionName) {
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
    await mongoClient.connect();
    console.log('Connected to MongoDB', MONGO_URL);
  }
  const db = mongoClient.db(DB_NAME);
  return db.collection(collectionName);
}

// register cocktail routes
const registerCocktailRoutes = require('./routes/cocktails');
registerCocktailRoutes(app, getCollection);

// register components routes
const registerComponentsRoutes = require('./routes/components');
registerComponentsRoutes(app, getCollection);

// register mqtt publisher routes
const registerMqttRoutes = require('./routes/mqtt');
registerMqttRoutes(app);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});