const Score = require('../models/score');
const Exam = require('../models/exam');
const Term = require('../models/term');
const SubjectAverage = require('../models/subjectAverage');
const SubjectYearlyAverage = require('../models/subjectYearlyAverage');
const StudentYearlyAverage = require('../models/studentYearlyAverage');
const Student = require('../models/student');
const Classroom = require('../models/classroom');
const Teacher = require('../models/teacher');
const Subject = require('../models/subject');
const TeacherSubject = require('../models/teacherSubject');
const ClassroomTeacher = require('../models/classroomTeacher');
const { updateAverages } = require('../services/averageService');

/**
 * Gán giáo viên nhận dạy lớp và tự động tính toán các môn có thể dạy.
 * @param {Object} teacher - Giáo viên hiện tại
 * @param {string} classroomCode - Mã lớp học
 * @returns {Array} - Danh sách môn được gán
 */
async function assignTeachingClassroom(teacher, classroomCode) {
    const classroom = await Classroom.findOne({ classroom_code: classroomCode });
    if (!classroom) {
        throw new Error('Không tìm thấy lớp học');
    }

    const allSubjects = (await Subject.find()).map(s => s.subject_code);
    if (!allSubjects.length) {
        throw new Error('Chưa có môn học nào trong hệ thống');
    }

    const teacherSubjects = (await TeacherSubject.find({ teacher_code: teacher.teacher_code }))
        .map(ts => ts.subject_code);
    if (!teacherSubjects.length) {
        throw new Error('Giáo viên này chưa được gán môn học nào');
    }

    const remainingSubjects = await getRemainingSubjects(classroomCode, allSubjects);
    if (!remainingSubjects.length) {
        throw new Error('Lớp đã đủ giáo viên dạy tất cả các môn');
    }

    const subjectsToAssign = teacherSubjects.filter(s => remainingSubjects.includes(s));
    if (!subjectsToAssign.length) {
        throw new Error('Giáo viên không có môn nào phù hợp để nhận dạy');
    }

    const insertData = subjectsToAssign.map(subjectCode => ({
        classroom_code: classroomCode,
        teacher_code: teacher.teacher_code,
        subject_code: subjectCode,
    }));
    await ClassroomTeacher.insertMany(insertData);

    return subjectsToAssign;
}

/**
 * Lấy danh sách môn còn lại mà lớp cần.
 * @param {string} classroomCode - Mã lớp học
 * @param {Array} allSubjects - Danh sách tất cả môn học
 * @returns {Array} - Danh sách môn còn thiếu
 */
async function getRemainingSubjects(classroomCode, allSubjects) {
    const assignedSubjects = (await ClassroomTeacher.find({ classroom_code: classroomCode }))
        .map(ct => ct.subject_code);
    return allSubjects.filter(s => !assignedSubjects.includes(s));
}

/**
 * Lấy danh sách giáo viên dạy trong một lớp dựa trên classroom_code.
 * @param {string} classroomCode - Mã lớp học
 * @returns {Array} - Danh sách giáo viên và các môn họ dạy
 */
async function getTeachersInClassroom(classroomCode) {
    const classroom = await Classroom.findOne({ classroom_code: classroomCode });
    if (!classroom) {
        throw new Error('Không tìm thấy lớp học');
    }

    const teachersInClass = await ClassroomTeacher.find({ classroom_code: classroomCode });
    if (!teachersInClass.length) {
        return [];
    }

    const teacherCodes = [...new Set(teachersInClass.map(t => t.teacher_code))];
    const teachers = await Teacher.find({ teacher_code: { $in: teacherCodes } }).select('-password');
    const subjectCodes = [...new Set(teachersInClass.map(t => t.subject_code))];
    const subjects = await Subject.find({ subject_code: { $in: subjectCodes } });

    const result = teacherCodes.map(teacherCode => {
        const teacher = teachers.find(t => t.teacher_code === teacherCode);
        const subjectsTaught = teachersInClass
            .filter(t => t.teacher_code === teacherCode)
            .map(t => {
                const subject = subjects.find(s => s.subject_code === t.subject_code);
                return subject ? { subject_code: subject.subject_code, subject_name: subject.subject_name } : null;
            })
            .filter(Boolean);

        return {
            teacher_code: teacher.teacher_code,
            name: teacher.name,
            email: teacher.email,
            subjects: subjectsTaught,
        };
    });

    return result;
}

/**
 * Nhập điểm mới hoặc sửa điểm cho học sinh trong một lớp cho một bài kiểm tra cụ thể.
 * @param {Object} teacher - Giáo viên hiện tại
 * @param {string} classroomCode - Mã lớp học
 * @param {string} examCode - Mã bài kiểm tra
 * @param {Array} scores - Danh sách điểm của học sinh
 * @returns {Array} - Danh sách tất cả điểm sau khi nhập hoặc sửa
 */
async function enterScores(teacher, classroomCode, examCode, scores) {
    // Kiểm tra lớp học có tồn tại không
    const classroom = await Classroom.findOne({ classroom_code: classroomCode });
    if (!classroom) {
        throw new Error('Không tìm thấy lớp học');
    }

    // Kiểm tra bài kiểm tra có tồn tại không
    const exam = await Exam.findOne({ exam_code: examCode });
    if (!exam) {
        throw new Error('Không tìm thấy bài kiểm tra');
    }

    // Kiểm tra xem giáo viên có quyền nhập điểm cho môn học này trong lớp này không
    const subjectCode = exam.subject_code;
    const isAssigned = await ClassroomTeacher.findOne({
        classroom_code: classroomCode,
        teacher_code: teacher.teacher_code,
        subject_code: subjectCode,
    });

    if (!isAssigned) {
        throw new Error('Bạn không có quyền nhập điểm cho môn học này trong lớp này');
    }

    // Lấy danh sách học sinh trong lớp
    const students = await Student.find({ classroom_code: classroomCode });
    const studentCodes = students.map(student => student.student_code);
    if (!studentCodes.length) {
        throw new Error('Lớp không có học sinh nào');
    }

    // Kiểm tra danh sách điểm gửi lên
    const studentCodesInRequest = scores.map(score => score.student_code);
    const scoreData = {};
    for (const score of scores) {
        const studentCode = score.student_code;
        const scoreValue = score.score_value;

        if (!studentCode || !studentCodes.includes(studentCode)) {
            throw new Error(`Học sinh ${studentCode} không thuộc lớp này`);
        }

        if (typeof scoreValue !== 'number' || scoreValue < 0 || scoreValue > 10) {
            throw new Error(`Điểm của học sinh ${studentCode} không hợp lệ. Điểm phải từ 0 đến 10.`);
        }

        scoreData[studentCode] = {
            student_code: studentCode,
            exam_code: examCode,
            score_value: scoreValue,
        };
    }

    // Lấy tất cả điểm hiện có của bài kiểm tra này cho học sinh trong lớp
    const existingScores = await Score.find({
        exam_code: examCode,
        student_code: { $in: studentCodes },
    });
    const existingScoresMap = existingScores.reduce((map, score) => {
        map[score.student_code] = score;
        return map;
    }, {});

    // Cập nhật hoặc thêm mới điểm
    const operations = [];
    for (const studentCode of studentCodesInRequest) {
        const score = scoreData[studentCode];
        const existingScore = existingScoresMap[studentCode];

        if (existingScore) {
            // Nếu điểm đã tồn tại, cập nhật điểm
            operations.push({
                updateOne: {
                    filter: { _id: existingScore._id },
                    update: {
                        $set: {
                            score_value: score.score_value,
                            updated_at: new Date(),
                        },
                    },
                },
            });
        } else {
            // Nếu điểm chưa tồn tại, thêm mới
            operations.push({
                insertOne: {
                    document: {
                        student_code: score.student_code,
                        exam_code: score.exam_code,
                        score_value: score.score_value,
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                },
            });
        }
    }

    // Thực hiện các thao tác bulkWrite
    if (operations.length > 0) {
        await Score.bulkWrite(operations);
    }

    // Gọi updateAverages thủ công cho từng học sinh
    for (const studentCode of studentCodesInRequest) {
        await updateAverages(studentCode, examCode);
    }

    // Lấy lại tất cả điểm (bao gồm cả điểm không được sửa) để trả về
    const updatedScores = await Score.find({
        exam_code: examCode,
        student_code: { $in: studentCodes },
    });

    return updatedScores.map(score => ({
        student_code: score.student_code,
        exam_code: score.exam_code,
        score_value: score.score_value,
    }));
}

module.exports = {
    assignTeachingClassroom,
    getRemainingSubjects,
    getTeachersInClassroom,
    enterScores,
};