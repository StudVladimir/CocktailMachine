const fs = require('fs');
const path = require('path');

module.exports = function registerCocktailRoutes(app, getCollection) {
  app.get('/api/cocktails', async (req, res) => {
    try {
      // use CockTails collection specifically
      const collection = await getCollection('CockTails');
      const count = await collection.countDocuments();
      if (count === 0) {
        const jsonPath = path.join(__dirname, '..', 'CockTails.json');
        if (fs.existsSync(jsonPath)) {
          const raw = fs.readFileSync(jsonPath, 'utf8');
          const docs = JSON.parse(raw);
          if (Array.isArray(docs) && docs.length > 0) {
            // Insert as-is into CockTails collection
            await collection.insertMany(docs);
            console.log(`Imported ${docs.length} cocktails into CockTails collection`);
          }
        }
      }
      const items = await collection.find({}).toArray();
      res.json(items);
    } catch (err) {
      console.error('Error in /api/cocktails', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};
