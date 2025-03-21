const { success, fail } = require('../utils/responseFormatter');
const Classroom = require('../models/classroom');

/**
 * Lấy danh sách tất cả các lớp học
 */
const getClassrooms = async (req, res) => {
    try {
        const classrooms = await Classroom.find({}, 'classroom_code classroom_name grade_code student_count homeroom_teacher_code');
        return success(res, classrooms, 'Lấy danh sách lớp học thành công');
    } catch (error) {
        return fail(res, 'Không thể lấy danh sách lớp học: ' + error.message, null, 500);
    }
};

module.exports = { getClassrooms };