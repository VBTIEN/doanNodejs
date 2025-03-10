const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const teacherSchema = new mongoose.Schema({
    teacher_code: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role_code: { type: String, ref: 'Role', required: true },
}, {
    timestamps: true,
});

teacherSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

teacherSchema.statics.findByEmail = async function (email) {
    return this.findOne({ email });
};

teacherSchema.statics.findByCode = async function (teacher_code) {
    return this.findOne({ teacher_code });
};

const Teacher = mongoose.model('Teacher', teacherSchema);
module.exports = Teacher;