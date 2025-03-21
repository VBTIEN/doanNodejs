const { success, fail } = require('../utils/responseFormatter');
const SchoolYear = require('../models/schoolYear');

/**
 * Lấy danh sách tất cả các năm học
 */
const getSchoolYears = async (req, res) => {
    try {
        const schoolYears = await SchoolYear.find({}, 'school_year_code school_year_name');
        return success(res, schoolYears, 'Lấy danh sách năm học thành công');
    } catch (error) {
        return fail(res, 'Không thể lấy danh sách năm học: ' + error.message, null, 500);
    }
};

module.exports = { getSchoolYears };