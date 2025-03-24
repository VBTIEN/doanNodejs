const mongoose = require('mongoose');

const studentTermAverageSchema = new mongoose.Schema({
    student_code: { type: String, ref: 'Student', required: true },
    term_code: { type: String, ref: 'Term', required: true },
    term_average: { type: Number, default: 0 },
    classroom_rank: { type: Number, default: null },
    grade_rank: { type: Number, default: null },
    academic_performance: { type: String, default: null },
}, {
    timestamps: true,
});

module.exports = mongoose.model('StudentTermAverage', studentTermAverageSchema);