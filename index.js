require('dotenv').config();
const express = require('express');
const connectDB = require('./config/database');
const { seedRoles, seedTerms, seedClassrooms, seedSubjects, seedExams, seedSchoolYears, seedGrades } = require('./config/seed');
const authRoutes = require('./routes/auth');
const cors = require('cors');

const app = express();

const corsOptions = {
    origin: 'http://localhost:5173', // Đây là origin của Vite React app
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
    console.log(`Received ${req.method} request to ${req.url}`);
    next();
});

const startServer = async () => {
    try {
        await connectDB();
        await seedRoles();
        await seedSubjects();
        await seedSchoolYears();
        await seedTerms();
        await seedExams();
        await seedGrades();
        await seedClassrooms();
        console.log('Database connected and seeded successfully');
    } catch (error) {
        console.error('Server startup error:', error.message);
        process.exit(1);
    }
};

startServer().then(() => {
    app.use(express.json());
    app.use('/api', authRoutes);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch((error) => {
    console.error('Error starting server:', error.message);
});