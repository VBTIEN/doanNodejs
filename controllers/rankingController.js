const { body, validationResult } = require('express-validator');
const Classroom = require('../models/classroom');
const Grade = require('../models/grade');
const Student = require('../models/student');
const StudentYearlyAverage = require('../models/studentYearlyAverage');
const StudentTermAverage = require('../models/studentTermAverage'); // Thêm model mới
const Term = require('../models/term');

// Validation middleware
const validateClassroomRankings = [
    body('classroom_code').notEmpty().withMessage('Classroom code is required'),
];

const validateGradeRankings = [
    body('grade_code').notEmpty().withMessage('Grade code is required'),
];

const validateTermRankings = [
    body('term_code').notEmpty().withMessage('Term code is required'),
];

// Lấy thứ hạng cả năm của học sinh trong một lớp cụ thể
const getClassroomYearlyRankings = [
    ...validateClassroomRankings,
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
            }

            const { classroom_code } = req.body;

            // Lấy classroom và grade để lấy school_year_code
            const classroom = await Classroom.findOne({ classroom_code });
            if (!classroom) {
                return res.status(404).json({ status: 'error', message: 'Classroom not found.' });
            }

            const grade = await Grade.findOne({ grade_code: classroom.grade_code });
            if (!grade) {
                return res.status(404).json({ status: 'error', message: 'Grade not found for the specified classroom.' });
            }

            const schoolYearCode = grade.school_year_code;

            // Lấy danh sách học sinh trong lớp
            const students = await Student.find({ classroom_code }).distinct('student_code');
            if (students.length === 0) {
                return res.status(404).json({ status: 'error', message: 'No students found in the specified classroom.' });
            }

            // Tính tổng số học sinh trong lớp
            const totalStudents = students.length;

            // Lấy thứ hạng cả năm của học sinh trong lớp
            const rankings = await StudentYearlyAverage.find({
                school_year_code: schoolYearCode,
                student_code: { $in: students },
            })
                .sort({ yearly_average: -1 })
                .select('student_code yearly_average classroom_rank')
                .lean();

            if (rankings.length === 0) {
                return res.status(404).json({ status: 'error', message: 'No yearly rankings found for the specified classroom.' });
            }

            const formattedRankings = rankings.map(item => ({
                student_code: item.student_code,
                yearly_average: item.yearly_average,
                classroom_rank: item.classroom_rank,
            }));

            return res.status(200).json({
                status: 'success',
                data: {
                    total_students: totalStudents,
                    rankings: formattedRankings,
                },
            });
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                message: 'An error occurred while fetching classroom yearly rankings.',
                error: error.message,
            });
        }
    },
];

// Lấy thứ hạng cả năm của học sinh trong một khối cụ thể
const getGradeYearlyRankings = [
    ...validateGradeRankings,
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
            }

            const { grade_code } = req.body;

            // Lấy grade để lấy school_year_code
            const grade = await Grade.findOne({ grade_code });
            if (!grade) {
                return res.status(404).json({ status: 'error', message: 'Grade not found.' });
            }

            const schoolYearCode = grade.school_year_code;

            // Lấy danh sách lớp học trong khối
            const classroomsInGrade = await Classroom.find({ grade_code }).distinct('classroom_code');
            if (!classroomsInGrade.length) {
                return res.status(404).json({ status: 'error', message: 'No classrooms found in the specified grade.' });
            }

            // Lấy danh sách học sinh trong khối dựa trên classroom_code
            const students = await Student.find({
                classroom_code: { $in: classroomsInGrade },
            }).distinct('student_code');

            if (students.length === 0) {
                return res.status(404).json({ status: 'error', message: 'No students found in the specified grade.' });
            }

            // Tính tổng số học sinh trong khối
            const totalStudents = students.length;

            // Lấy thứ hạng cả năm của học sinh trong khối
            const rankings = await StudentYearlyAverage.find({
                school_year_code: schoolYearCode,
                student_code: { $in: students },
            })
                .sort({ yearly_average: -1 })
                .select('student_code yearly_average grade_rank')
                .lean();

            if (rankings.length === 0) {
                return res.status(404).json({ status: 'error', message: 'No yearly rankings found for the specified grade.' });
            }

            // Kiểm tra xem grade_rank có bị null không
            const hasNullGradeRank = rankings.some(item => item.grade_rank == null);
            if (hasNullGradeRank) {
                console.log(`Some grade_rank values are null for grade ${grade_code}, school_year ${schoolYearCode}`);
            }

            const formattedRankings = rankings.map(item => ({
                student_code: item.student_code,
                yearly_average: item.yearly_average,
                grade_rank: item.grade_rank,
            }));

            return res.status(200).json({
                status: 'success',
                data: {
                    total_students: totalStudents,
                    rankings: formattedRankings,
                },
            });
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                message: 'An error occurred while fetching grade yearly rankings.',
                error: error.message,
            });
        }
    },
];

// Lấy thứ hạng học kỳ của học sinh trong một lớp cụ thể
const getClassroomTermRankings = [
    ...validateClassroomRankings,
    ...validateTermRankings,
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
            }

            const { classroom_code, term_code } = req.body;

            // Kiểm tra term_code có tồn tại không
            const term = await Term.findOne({ term_code });
            if (!term) {
                return res.status(404).json({ status: 'error', message: 'Term not found.' });
            }

            // Lấy classroom để kiểm tra
            const classroom = await Classroom.findOne({ classroom_code });
            if (!classroom) {
                return res.status(404).json({ status: 'error', message: 'Classroom not found.' });
            }

            // Lấy danh sách học sinh trong lớp
            const students = await Student.find({ classroom_code }).distinct('student_code');
            if (students.length === 0) {
                return res.status(404).json({ status: 'error', message: 'No students found in the specified classroom.' });
            }

            // Tính tổng số học sinh trong lớp
            const totalStudents = students.length;

            // Lấy thứ hạng học kỳ của học sinh trong lớp
            const rankings = await StudentTermAverage.find({
                term_code: term_code,
                student_code: { $in: students },
            })
                .sort({ term_average: -1 })
                .select('student_code term_average classroom_rank')
                .lean();

            if (rankings.length === 0) {
                return res.status(404).json({ status: 'error', message: 'No term rankings found for the specified classroom and term.' });
            }

            const formattedRankings = rankings.map(item => ({
                student_code: item.student_code,
                term_average: item.term_average,
                classroom_rank: item.classroom_rank,
            }));

            return res.status(200).json({
                status: 'success',
                data: {
                    total_students: totalStudents,
                    rankings: formattedRankings,
                },
            });
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                message: 'An error occurred while fetching classroom term rankings.',
                error: error.message,
            });
        }
    },
];

// Lấy thứ hạng học kỳ của học sinh trong một khối cụ thể
const getGradeTermRankings = [
    ...validateGradeRankings,
    ...validateTermRankings,
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ status: 'error', message: errors.array()[0].msg });
            }

            const { grade_code, term_code } = req.body;

            // Kiểm tra term_code có tồn tại không
            const term = await Term.findOne({ term_code });
            if (!term) {
                return res.status(404).json({ status: 'error', message: 'Term not found.' });
            }

            // Lấy grade để kiểm tra
            const grade = await Grade.findOne({ grade_code });
            if (!grade) {
                return res.status(404).json({ status: 'error', message: 'Grade not found.' });
            }

            // Lấy danh sách lớp học trong khối
            const classroomsInGrade = await Classroom.find({ grade_code }).distinct('classroom_code');
            if (!classroomsInGrade.length) {
                return res.status(404).json({ status: 'error', message: 'No classrooms found in the specified grade.' });
            }

            // Lấy danh sách học sinh trong khối dựa trên classroom_code
            const students = await Student.find({
                classroom_code: { $in: classroomsInGrade },
            }).distinct('student_code');

            if (students.length === 0) {
                return res.status(404).json({ status: 'error', message: 'No students found in the specified grade.' });
            }

            // Tính tổng số học sinh trong khối
            const totalStudents = students.length;

            // Lấy thứ hạng học kỳ của học sinh trong khối
            const rankings = await StudentTermAverage.find({
                term_code: term_code,
                student_code: { $in: students },
            })
                .sort({ term_average: -1 })
                .select('student_code term_average grade_rank')
                .lean();

            if (rankings.length === 0) {
                return res.status(404).json({ status: 'error', message: 'No term rankings found for the specified grade and term.' });
            }

            // Kiểm tra xem grade_rank có bị null không
            const hasNullGradeRank = rankings.some(item => item.grade_rank == null);
            if (hasNullGradeRank) {
                console.log(`Some grade_rank values are null for grade ${grade_code}, term ${term_code}`);
            }

            const formattedRankings = rankings.map(item => ({
                student_code: item.student_code,
                term_average: item.term_average,
                grade_rank: item.grade_rank,
            }));

            return res.status(200).json({
                status: 'success',
                data: {
                    total_students: totalStudents,
                    rankings: formattedRankings,
                },
            });
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                message: 'An error occurred while fetching grade term rankings.',
                error: error.message,
            });
        }
    },
];

module.exports = {
    getClassroomYearlyRankings,
    getGradeYearlyRankings,
    getClassroomTermRankings, // Thêm hàm mới
    getGradeTermRankings, // Thêm hàm mới
};