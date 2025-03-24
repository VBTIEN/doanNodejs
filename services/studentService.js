const Score = require('../models/score');

/**
 * Lấy danh sách điểm của học sinh với bộ lọc tùy chọn.
 * @param {string} studentCode - Mã học sinh
 * @param {string|null} subjectCode - Mã môn học (tùy chọn)
 * @param {string|null} termCode - Mã kỳ học (tùy chọn)
 * @returns {Array} - Danh sách điểm
 */
async function getStudentScores(studentCode, subjectCode = null, termCode = null) {
    // Tạo pipeline cho aggregation
    const pipeline = [
        // Lọc điểm của học sinh
        {
            $match: {
                student_code: studentCode,
            },
        },
        // Lookup để lấy thông tin từ collection exams
        {
            $lookup: {
                from: 'exams',
                localField: 'exam_code',
                foreignField: 'exam_code',
                as: 'exam',
            },
        },
        // Unwind để chuyển mảng exam thành object
        {
            $unwind: '$exam',
        },
        // Project để chỉ lấy các trường cần thiết
        {
            $project: {
                exam_code: 1,
                term_code: '$exam.term_code',
                subject_code: '$exam.subject_code',
                score_value: 1,
                _id: 0, // Loại bỏ trường _id
            },
        },
    ];

    // Áp dụng bộ lọc subject_code và term_code nếu có
    const matchStage = {};
    if (subjectCode) {
        matchStage.subject_code = subjectCode;
    }
    if (termCode) {
        matchStage.term_code = termCode;
    }
    if (Object.keys(matchStage).length > 0) {
        pipeline.push({
            $match: matchStage,
        });
    }

    // Thực hiện aggregation
    const scores = await Score.aggregate(pipeline);

    return scores;
}

module.exports = {
    getStudentScores,
};