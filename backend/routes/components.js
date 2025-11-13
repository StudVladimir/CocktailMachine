const fs = require('fs');
const path = require('path');

module.exports = function registerComponentsRoutes(app, getCollection) {
  app.get('/api/cocktails/components', async (req, res) => {
    try {
      // use CockTailsComponents collection specifically
      const collection = await getCollection('CockTailsComponents');
      const count = await collection.countDocuments();
      if (count === 0) {
        const jsonPath = path.join(__dirname, '..', 'Components.json');
        if (fs.existsSync(jsonPath)) {
          const raw = fs.readFileSync(jsonPath, 'utf8');
          const docs = JSON.parse(raw);
          if (Array.isArray(docs) && docs.length > 0) {
            // Insert as-is into CockTailsComponents collection
            await collection.insertMany(docs);
            console.log(`Imported ${docs.length} cocktail components into CockTailsComponents collection`);
          }
        }
      }
      const items = await collection.find({}).toArray();
      res.json(items);
    } catch (err) {
      console.error('Error in /api/cocktails/components', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};
