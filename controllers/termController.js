const { success, fail } = require('../utils/responseFormatter');
const Term = require('../models/term');

/**
 * Lấy danh sách tất cả các học kỳ
 */
const getTerms = async (req, res) => {
    try {
        const terms = await Term.find({}, 'term_code term_name start_date end_date school_year_code');
        return success(res, terms, 'Lấy danh sách học kỳ thành công');
    } catch (error) {
        return fail(res, 'Không thể lấy danh sách học kỳ: ' + error.message, null, 500);
    }
};

module.exports = { getTerms };