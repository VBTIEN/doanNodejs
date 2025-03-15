const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
    student_code: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    googleId: { type: String, unique: true },
    role_code: { type: String, ref: 'Role', required: true },
}, {
    timestamps: true,
});

studentSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

studentSchema.statics.findByEmail = async function (email) {
    return this.findOne({ email });
};

studentSchema.statics.findByCode = async function (student_code) {
    return this.findOne({ student_code });
};

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;