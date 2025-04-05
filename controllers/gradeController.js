const { success, fail } = require('../utils/responseFormatter');
const Grade = require('../models/grade');
const SchoolYear = require('../models/schoolYear');

/**
 * Lấy danh sách tất cả các khối
 */
const getGrades = async (req, res) => {
    try {
        const grades = await Grade.find({}, 'grade_code grade_name classroom_count school_year_code')
            .populate('schoolYear', 'school_year_code school_year_name');
        return success(res, grades, 'Lấy danh sách khối thành công');
    } catch (error) {
        return fail(res, 'Không thể lấy danh sách khối: ' + error.message, null, 500);
    }
};

/**
 * Tạo một khối mới
 */
const createGrade = async (req, res) => {
    try {
        const { grade_level, school_year_code } = req.body;

        // Validate input
        if (!grade_level || !['10', '11', '12'].includes(grade_level)) {
            return fail(res, 'grade_level phải là 10, 11 hoặc 12', null, 400);
        }
        if (!school_year_code) {
            return fail(res, 'school_year_code là bắt buộc', null, 400);
        }

        // Kiểm tra school_year_code có tồn tại không
        const schoolYear = await SchoolYear.findOne({ school_year_code });
        if (!schoolYear) {
            return fail(res, 'Mã năm học không tồn tại', null, 400);
        }

        // Tạo grade_code theo định dạng G{grade_level}_{school_year_code}
        const grade_code = `G${grade_level}_${school_year_code}`;

        // Kiểm tra uniqueness của grade_code
        const existingGrade = await Grade.findOne({ grade_code });
        if (existingGrade) {
            return fail(res, `Khối với grade_code ${grade_code} đã tồn tại`, null, 400);
        }

        // Tạo grade_name theo định dạng "Khối {grade_level} Năm {school_year_name}"
        const grade_name = `Khối ${grade_level} Năm ${schoolYear.school_year_name}`;

        const grade = new Grade({
            grade_code,
            grade_name,
            classroom_count: 0,
            school_year_code,
        });

        await grade.save();

        // Populate dữ liệu để trả về
        const populatedGrade = await Grade.findOne({ grade_code })
            .populate('schoolYear', 'school_year_code school_year_name');

        return success(res, populatedGrade, 'Tạo khối thành công');
    } catch (error) {
        return fail(res, 'Không thể tạo khối: ' + error.message, null, 500);
    }
};

/**
 * Lấy thông tin chi tiết của một khối theo grade_code
 */
const getGradeByCode = async (req, res) => {
    try {
        const { grade_code } = req.params;

        const grade = await Grade.findOne({ grade_code }, 'grade_code grade_name classroom_count school_year_code')
            .populate('schoolYear', 'school_year_code school_year_name');

        if (!grade) {
            return fail(res, 'Khối không tồn tại', null, 404);
        }

        return success(res, grade, 'Lấy thông tin khối thành công');
    } catch (error) {
        return fail(res, 'Không thể lấy thông tin khối: ' + error.message, null, 500);
    }
};

/**
 * Cập nhật thông tin một khối
 */
const updateGrade = async (req, res) => {
    try {
        const { grade_code } = req.params;
        const { grade_level, school_year_code } = req.body;

        const grade = await Grade.findOne({ grade_code });
        if (!grade) {
            return fail(res, 'Khối không tồn tại', null, 404);
        }

        // Validate input
        if (!grade_level || !['10', '11', '12'].includes(grade_level)) {
            return fail(res, 'grade_level phải là 10, 11 hoặc 12', null, 400);
        }
        if (!school_year_code) {
            return fail(res, 'school_year_code là bắt buộc', null, 400);
        }

        // Kiểm tra school_year_code có tồn tại không
        const schoolYear = await SchoolYear.findOne({ school_year_code });
        if (!schoolYear) {
            return fail(res, 'Mã năm học không tồn tại', null, 400);
        }

        // Tạo grade_code mới
        const new_grade_code = `G${grade_level}_${school_year_code}`;

        // Kiểm tra uniqueness của grade_code mới (nếu thay đổi)
        if (new_grade_code !== grade.grade_code) {
            const existingGrade = await Grade.findOne({ grade_code: new_grade_code });
            if (existingGrade) {
                return fail(res, `Khối với grade_code ${new_grade_code} đã tồn tại`, null, 400);
            }
        }

        // Tạo grade_name mới
        const new_grade_name = `Khối ${grade_level} Năm ${schoolYear.school_year_name}`;

        // Cập nhật thông tin
        grade.grade_code = new_grade_code;
        grade.grade_name = new_grade_name;
        grade.school_year_code = school_year_code;

        await grade.save();

        // Populate dữ liệu để trả về
        const populatedGrade = await Grade.findOne({ grade_code: new_grade_code })
            .populate('schoolYear', 'school_year_code school_year_name');

        return success(res, populatedGrade, 'Cập nhật khối thành công');
    } catch (error) {
        return fail(res, 'Không thể cập nhật khối: ' + error.message, null, 500);
    }
};

/**
 * Xóa một khối
 */
const deleteGrade = async (req, res) => {
    try {
        const { grade_code } = req.params;

        const grade = await Grade.findOne({ grade_code });
        if (!grade) {
            return fail(res, 'Khối không tồn tại', null, 404);
        }

        const classroomCount = grade.classroom_count;
        if (classroomCount > 0) {
            return fail(res, 'Không thể xóa khối vì có lớp học liên quan', null, 400);
        }

        await grade.deleteOne();

        return success(res, null, 'Xóa khối thành công');
    } catch (error) {
        return fail(res, 'Không thể xóa khối: ' + error.message, null, 500);
    }
};

module.exports = { getGrades, createGrade, getGradeByCode, updateGrade, deleteGrade };