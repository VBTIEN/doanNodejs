const StudentTermAverage = require('../models/studentTermAverage');
const StudentYearlyAverage = require('../models/studentYearlyAverage');
const Student = require('../models/student');
const Classroom = require('../models/classroom');
const Grade = require('../models/grade');

/**
 * Lấy danh sách học sinh theo học lực trong một lớp (theo kỳ).
 */
const getClassroomTermPerformance = async (req, res) => {
    try {
        const { classroom_code, term_code, academic_performance } = req.body;

        // Validate request
        if (!classroom_code || !term_code || !academic_performance) {
            return res.status(400).json({
                status: 'error',
                message: 'Classroom code, term code, and academic performance are required.',
            });
        }

        if (!['Giỏi', 'Khá', 'Trung bình', 'Yếu'].includes(academic_performance)) {
            return res.status(400).json({
                status: 'error',
                message: 'Academic performance must be one of: Giỏi, Khá, Trung bình, Yếu.',
            });
        }

        // Kiểm tra classroom
        const classroom = await Classroom.findOne({ classroom_code });
        if (!classroom) {
            return res.status(404).json({
                status: 'error',
                message: 'Classroom not found.',
            });
        }

        // Lấy danh sách học sinh trong lớp
        const students = await Student.find({ classroom_code }).distinct('student_code');
        if (!students.length) {
            return res.status(404).json({
                status: 'error',
                message: 'No students found in the specified classroom.',
            });
        }

        // Lấy danh sách học sinh theo học lực trong kỳ
        const studentsWithPerformance = await StudentTermAverage.find({
            term_code,
            student_code: { $in: students },
            academic_performance,
        }).select('student_code term_average academic_performance');

        if (!studentsWithPerformance.length) {
            return res.status(404).json({
                status: 'error',
                message: `No students found with academic performance '${academic_performance}' in the specified classroom and term.`,
            });
        }

        // Tính tổng số học sinh thỏa mãn điều kiện học lực
        const totalStudents = studentsWithPerformance.length;

        return res.status(200).json({
            status: 'success',
            data: {
                total_students: totalStudents,
                students: studentsWithPerformance.map(item => ({
                    student_code: item.student_code,
                    term_average: item.term_average,
                    academic_performance: item.academic_performance,
                })),
            },
        });
    } catch (error) {
        console.log(`Error in getClassroomTermPerformance: ${error.message}`);
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching classroom term performance.',
            error: error.message,
        });
    }
};

/**
 * Lấy danh sách học sinh theo học lực trong một lớp (theo năm).
 */
const getClassroomYearlyPerformance = async (req, res) => {
    try {
        const { classroom_code, academic_performance } = req.body;

        // Validate request
        if (!classroom_code || !academic_performance) {
            return res.status(400).json({
                status: 'error',
                message: 'Classroom code and academic performance are required.',
            });
        }

        if (!['Giỏi', 'Khá', 'Trung bình', 'Yếu'].includes(academic_performance)) {
            return res.status(400).json({
                status: 'error',
                message: 'Academic performance must be one of: Giỏi, Khá, Trung bình, Yếu.',
            });
        }

        // Kiểm tra classroom và grade
        const classroom = await Classroom.findOne({ classroom_code });
        if (!classroom) {
            return res.status(404).json({
                status: 'error',
                message: 'Classroom not found.',
            });
        }

        const grade = await Grade.findOne({ grade_code: classroom.grade_code });
        if (!grade) {
            return res.status(404).json({
                status: 'error',
                message: 'Grade not found for the specified classroom.',
            });
        }

        const school_year_code = grade.school_year_code;

        // Lấy danh sách học sinh trong lớp
        const students = await Student.find({ classroom_code }).distinct('student_code');
        if (!students.length) {
            return res.status(404).json({
                status: 'error',
                message: 'No students found in the specified classroom.',
            });
        }

        // Lấy danh sách học sinh theo học lực trong năm
        const studentsWithPerformance = await StudentYearlyAverage.find({
            school_year_code,
            student_code: { $in: students },
            academic_performance,
        }).select('student_code yearly_average academic_performance');

        if (!studentsWithPerformance.length) {
            return res.status(404).json({
                status: 'error',
                message: `No students found with academic performance '${academic_performance}' in the specified classroom and school year.`,
            });
        }

        // Tính tổng số học sinh thỏa mãn điều kiện học lực
        const totalStudents = studentsWithPerformance.length;

        return res.status(200).json({
            status: 'success',
            data: {
                total_students: totalStudents,
                students: studentsWithPerformance.map(item => ({
                    student_code: item.student_code,
                    yearly_average: item.yearly_average,
                    academic_performance: item.academic_performance,
                })),
            },
        });
    } catch (error) {
        console.log(`Error in getClassroomYearlyPerformance: ${error.message}`);
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching classroom yearly performance.',
            error: error.message,
        });
    }
};

/**
 * Lấy danh sách học sinh theo học lực trong một khối (theo kỳ).
 */
const getGradeTermPerformance = async (req, res) => {
    try {
        const { grade_code, term_code, academic_performance } = req.body;

        // Validate request
        if (!grade_code || !term_code || !academic_performance) {
            return res.status(400).json({
                status: 'error',
                message: 'Grade code, term code, and academic performance are required.',
            });
        }

        if (!['Giỏi', 'Khá', 'Trung bình', 'Yếu'].includes(academic_performance)) {
            return res.status(400).json({
                status: 'error',
                message: 'Academic performance must be one of: Giỏi, Khá, Trung bình, Yếu.',
            });
        }

        // Lấy danh sách lớp học trong khối
        const classroomsInGrade = await Classroom.find({ grade_code }).distinct('classroom_code');
        if (!classroomsInGrade.length) {
            return res.status(404).json({
                status: 'error',
                message: 'No classrooms found in the specified grade.',
            });
        }

        // Lấy danh sách học sinh trong khối
        const students = await Student.find({
            classroom_code: { $in: classroomsInGrade },
        }).distinct('student_code');
        if (!students.length) {
            return res.status(404).json({
                status: 'error',
                message: 'No students found in the specified grade.',
            });
        }

        // Lấy danh sách học sinh theo học lực trong kỳ
        const studentsWithPerformance = await StudentTermAverage.find({
            term_code,
            student_code: { $in: students },
            academic_performance,
        }).select('student_code term_average academic_performance');

        if (!studentsWithPerformance.length) {
            return res.status(404).json({
                status: 'error',
                message: `No students found with academic performance '${academic_performance}' in the specified grade and term.`,
            });
        }

        // Tính tổng số học sinh thỏa mãn điều kiện học lực
        const totalStudents = studentsWithPerformance.length;

        return res.status(200).json({
            status: 'success',
            data: {
                total_students: totalStudents,
                students: studentsWithPerformance.map(item => ({
                    student_code: item.student_code,
                    term_average: item.term_average,
                    academic_performance: item.academic_performance,
                })),
            },
        });
    } catch (error) {
        console.log(`Error in getGradeTermPerformance: ${error.message}`);
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching grade term performance.',
            error: error.message,
        });
    }
};

/**
 * Lấy danh sách học sinh theo học lực trong một khối (theo năm).
 */
const getGradeYearlyPerformance = async (req, res) => {
    try {
        const { grade_code, academic_performance } = req.body;

        // Validate request
        if (!grade_code || !academic_performance) {
            return res.status(400).json({
                status: 'error',
                message: 'Grade code and academic performance are required.',
            });
        }

        if (!['Giỏi', 'Khá', 'Trung bình', 'Yếu'].includes(academic_performance)) {
            return res.status(400).json({
                status: 'error',
                message: 'Academic performance must be one of: Giỏi, Khá, Trung bình, Yếu.',
            });
        }

        // Kiểm tra grade
        const grade = await Grade.findOne({ grade_code });
        if (!grade) {
            return res.status(404).json({
                status: 'error',
                message: 'Grade not found.',
            });
        }

        const school_year_code = grade.school_year_code;

        // Lấy danh sách lớp học trong khối
        const classroomsInGrade = await Classroom.find({ grade_code }).distinct('classroom_code');
        if (!classroomsInGrade.length) {
            return res.status(404).json({
                status: 'error',
                message: 'No classrooms found in the specified grade.',
            });
        }

        // Lấy danh sách học sinh trong khối
        const students = await Student.find({
            classroom_code: { $in: classroomsInGrade },
        }).distinct('student_code');
        if (!students.length) {
            return res.status(404).json({
                status: 'error',
                message: 'No students found in the specified grade.',
            });
        }

        // Lấy danh sách học sinh theo học lực trong năm
        const studentsWithPerformance = await StudentYearlyAverage.find({
            school_year_code,
            student_code: { $in: students },
            academic_performance,
        }).select('student_code yearly_average academic_performance');

        if (!studentsWithPerformance.length) {
            return res.status(404).json({
                status: 'error',
                message: `No students found with academic performance '${academic_performance}' in the specified grade and school year.`,
            });
        }

        // Tính tổng số học sinh thỏa mãn điều kiện học lực
        const totalStudents = studentsWithPerformance.length;

        return res.status(200).json({
            status: 'success',
            data: {
                total_students: totalStudents,
                students: studentsWithPerformance.map(item => ({
                    student_code: item.student_code,
                    yearly_average: item.yearly_average,
                    academic_performance: item.academic_performance,
                })),
            },
        });
    } catch (error) {
        console.log(`Error in getGradeYearlyPerformance: ${error.message}`);
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching grade yearly performance.',
            error: error.message,
        });
    }
};

module.exports = {
    getClassroomTermPerformance,
    getClassroomYearlyPerformance,
    getGradeTermPerformance,
    getGradeYearlyPerformance,
};