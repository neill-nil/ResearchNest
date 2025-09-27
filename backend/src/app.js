require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./models'); // Imports the index.js from models

// Import routes
const authRoutes = require('./api/routes/auth.routes');
const milestoneRoutes = require('./api/routes/milestones.routes');
const progressRoutes = require('./api/routes/progress.routes');


const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to ResearchNest API.' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/progress', progressRoutes);


const PORT = process.env.PORT || 5000;

// Sync database and start server
db.sequelize.sync().then(() => {
    console.log('Database synced successfully.');
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}.`);
    });
}).catch(err => {
    console.error('Failed to sync database:', err);
});