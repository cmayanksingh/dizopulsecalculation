const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const { seedDatabase } = require('./seed');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Note: Clean business account starting from ₹0. No automatic demo seeding.

// API Routes
app.use('/api', routes);

// Serve frontend build
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

// SPA fallback for Express 5
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), err => {
    if (err) {
      res.status(200).send('Apex Accounting Server is running on port ' + PORT);
    }
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Apex Business Accounting & Sales Management System`);
  console.log(` Server is running live on: http://localhost:${PORT}`);
  console.log(` API Endpoint: http://localhost:${PORT}/api/overview`);
  console.log(`====================================================`);
});
