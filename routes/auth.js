const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { getAllTeachers, getStudentsByClassroom, assignHomeroomClassroom, assignTeachingClassroom, getTeachersInClassroom, enterScores, updateTeacher } = require('../controllers/teacherController');
const RoleController = require('../controllers/roleController');
const SchoolYearController = require('../controllers/schoolYearController');
const ClassroomController = require('../controllers/classroomController');
const ExamController = require('../controllers/examController');
const GradeController = require('../controllers/gradeController');
const SubjectController = require('../controllers/subjectController');
const TermController = require('../controllers/termController');
const { getScores, updateStudent } = require('../controllers/studentController');
const {
    getClassroomYearlyRankings,
    getGradeYearlyRankings,
    getClassroomTermRankings,
    getGradeTermRankings,
} = require('../controllers/rankingController');
const academicPerformanceController = require('../controllers/academicPerformanceController');
const auth = require('../middleware/auth');
const { redirectToGoogle, handleGoogleCallback, selectRole } = require('../controllers/googleController');
const {
    exportScores,
    exportStudentTermAverages,
    exportStudentYearlyAverages,
} = require('../controllers/exportController');
const { importScores } = require('../controllers/importController');
const upload = require('../middleware/multerConfig');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/password/forgot', authController.forgotPassword);
router.post('/password/reset', authController.resetPassword);
router.get('/password/validate-token', authController.validateToken);

router.get('/status', (req, res) => { res.json({ status: 'ok', backend: 'js' }); });

router.get('/auth/google', redirectToGoogle);
router.get('/auth/google/callback', handleGoogleCallback);
router.post('/select-role', express.json(), selectRole);

router.get('/roles', RoleController.getRoles);
router.get('/school-years', SchoolYearController.getSchoolYears);
router.get('/classrooms', ClassroomController.getClassrooms);
router.get('/exams', ExamController.getExams);
router.get('/grades', GradeController.getGrades);
router.get('/subjects', SubjectController.getSubjects);
router.get('/terms', TermController.getTerms);

router.get('/teachers-in-classroom', getTeachersInClassroom);

router.post('/rankings/classroom-yearly', getClassroomYearlyRankings);
router.post('/rankings/grade-yearly', getGradeYearlyRankings);
router.post('/rankings/classroom-term', getClassroomTermRankings);
router.post('/rankings/grade-term', getGradeTermRankings);

router.post('/academic-performance/classroom-term', academicPerformanceController.getClassroomTermPerformance);
router.post('/academic-performance/classroom-yearly', academicPerformanceController.getClassroomYearlyPerformance);
router.post('/academic-performance/grade-term', academicPerformanceController.getGradeTermPerformance);
router.post('/academic-performance/grade-yearly', academicPerformanceController.getGradeYearlyPerformance);

router.get('/export-scores', exportScores);
router.get('/export-student-term-averages', exportStudentTermAverages);
router.get('/export-student-yearly-averages', exportStudentYearlyAverages);

router.post('/import-scores', upload.single('file'), importScores);

router.use(auth);////////////////////////////////////////////////////////////////////////////////////////////////

router.post('/logout', authController.logout);
router.get('/user', authController.getUser);

router.get('/teachers', getAllTeachers);
router.get('/students-by-classroom', getStudentsByClassroom);
router.post('/assign-homeroom-classroom', assignHomeroomClassroom);
router.post('/assign-teaching-classroom', assignTeachingClassroom);
router.post('/teacher/enter-scores', enterScores);
router.put('/teacher/update', updateTeacher);

router.post('/student/scores', getScores);
router.put('/student/update', updateStudent);

module.exports = router;