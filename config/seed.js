const mongoose = require('mongoose');
const Role = require('../models/role');

const seedRoles = async () => {
    try {
        const roleCount = await Role.countDocuments();
        if (roleCount === 0) {
            console.log('Seeding roles...');
            await Role.insertMany([
                { role_code: 'R1', role_name: 'Teacher' },
                { role_code: 'R2', role_name: 'Student' },
            ]);
            console.log('Roles seeded successfully');
        } else {
            console.log('Roles already exist, skipping seed');
        }
    } catch (error) {
        console.error('Error seeding roles:', error);
    }
};

module.exports = seedRoles;