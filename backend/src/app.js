require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./models'); 

// Routes
const userRoutes = require('./api/routes/userRoutes');
const milestoneRoutes = require('./api/routes/milestoneRoutes');

const stageRoutes = require('./api/routes/stagesRoutes.js'); 
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/stages', stageRoutes);
// Health check route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to ResearchNest API.' });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/milestones', milestoneRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;

// Connect DB and start server
db.sequelize.authenticate()
    .then(() => {
        console.log('✅ Database connection established.');
        return db.sequelize.sync({ alter: true }); // use { force: true } if you want to reset DB
    })
    .then(() => {
        console.log('✅ Database synced successfully.');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
        });
    })
    .catch(err => {
        console.error('❌ Failed to connect/sync database:', err);
    });
