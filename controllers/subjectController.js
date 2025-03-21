const { success, fail } = require('../utils/responseFormatter');
const Subject = require('../models/subject');

/**
 * Lấy danh sách tất cả các môn học
 */
const getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find({}, 'subject_code subject_name');
        return success(res, subjects, 'Lấy danh sách môn học thành công');
    } catch (error) {
        return fail(res, 'Không thể lấy danh sách môn học: ' + error.message, null, 500);
    }
};

module.exports = { getSubjects };