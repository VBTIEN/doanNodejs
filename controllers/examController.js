const { success, fail } = require('../utils/responseFormatter');
const Exam = require('../models/exam');

/**
 * Lấy danh sách tất cả các kỳ thi
 */
const getExams = async (req, res) => {
    try {
        const exams = await Exam.find({}, 'exam_code exam_name subject_code term_code date');
        return success(res, exams, 'Lấy danh sách kỳ thi thành công');
    } catch (error) {
        return fail(res, 'Không thể lấy danh sách kỳ thi: ' + error.message, null, 500);
    }
};

module.exports = { getExams };