const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { getAllTeachers, getStudentsByClassroom, assignHomeroomClassroom, assignTeachingClassroom, getTeachersInClassroom } = require('../controllers/teacherController');
const RoleController = require('../controllers/roleController');
const SchoolYearController = require('../controllers/schoolYearController');
const ClassroomController = require('../controllers/classroomController');
const ExamController = require('../controllers/examController');
const GradeController = require('../controllers/gradeController');
const SubjectController = require('../controllers/subjectController');
const TermController = require('../controllers/termController');
const auth = require('../middleware/auth');
const { redirectToGoogle, handleGoogleCallback, selectRole } = require('../controllers/googleController');

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

router.use(auth);////////////////////////////////////////////////////////////////////////////////////////////////

router.post('/logout', authController.logout);
router.get('/user', authController.getUser);

router.get('/teachers', getAllTeachers);
router.get('/students-by-classroom', getStudentsByClassroom);
router.post('/assign-homeroom-classroom', assignHomeroomClassroom);
router.post('/assign-teaching-classroom', assignTeachingClassroom);

module.exports = router;