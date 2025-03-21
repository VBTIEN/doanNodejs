const Teacher = require('../models/teacher');
const Classroom = require('../models/classroom');
const Subject = require('../models/subject');
const TeacherSubject = require('../models/teacherSubject');
const ClassroomTeacher = require('../models/classroomTeacher');

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

module.exports = {
    assignTeachingClassroom,
    getRemainingSubjects,
    getTeachersInClassroom,
};