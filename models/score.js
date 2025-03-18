const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
    student_code: { type: String, ref: 'Student', required: true },
    exam_code: { type: String, ref: 'Exam', required: true },
    score_value: { type: Number, required: true },
}, {
    timestamps: true,
});

const Score = mongoose.model('Score', scoreSchema);
module.exports = Score;