require('dotenv').config();
const express = require('express');
const connectDB = require('./config/database');
const seedRoles = require('./config/seed');
const authRoutes = require('./routes/auth');

const app = express();

const startServer = async () => {
    await connectDB();
    await seedRoles();
};

startServer();

app.use(express.json());
app.use('/api', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});