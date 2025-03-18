const Teacher = require('../models/teacher');
const Student = require('../models/student');
const Role = require('../models/role');
const {
    checkEmailExists,
    generateCode,
    generateToken,
    saveAccessToken,
    findUserByEmail,
} = require('../utils/authUtils');
const bcrypt = require('bcryptjs');
const { forgotPasswordService, resetPasswordService, validateTokenService } = require('../services/passwordService');
const { validateAndAssignHomeroomTeacher } = require('../services/authService');
const Classroom = require('../models/classroom');

const register = async (req, res) => {
    try {
        const { name, email, password, role_code, classroom_code } = req.body;

        if (await checkEmailExists(email)) {
            return res.status(422).json({ message: 'Email already exists' });
        }

        const role = await Role.findByCode(role_code);
        if (!role) {
            return res.status(422).json({ message: 'Invalid role_code' });
        }

        const code = await generateCode(role_code);
        let user;

        if (role_code === 'R1') {
            user = new Teacher({ teacher_code: code, email, password, name, role_code });
        } else if (role_code === 'R2') {
            user = new Student({ student_code: code, email, password, name, role_code });
        }

        await user.save();

        if (role_code === 'R1' && classroom_code) {
            await validateAndAssignHomeroomTeacher(user, classroom_code);
        }

        const token = generateToken(code, role_code === 'R1' ? 'teacher' : 'student');
        await saveAccessToken(token, code, role_code === 'R1' ? 'teacher' : 'student');

        res.status(201).json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        let user;
        user = await Teacher.findOne({ email });
        if (!user) {
            user = await Student.findOne({ email });
        }

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const code = user.teacher_code || user.student_code;
        const type = user.teacher_code ? 'teacher' : 'student';
        const token = generateToken(code, type);
        await saveAccessToken(token, code, type);

        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const logout = async (req, res) => {
    try {
        const token = req.token;
        await AccessToken.updateOne({ token }, { revoked: true });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getUser = (req, res) => {
    const { password, ...userData } = req.user.toObject();
    res.json(userData);
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await forgotPasswordService(email);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { password, password_confirmation } = req.body;
        const email = req.query.email;
        const token = req.headers.authorization?.split(' ')[1];

        if (!email || !token) {
            return res.status(400).json({ message: 'Email và token là bắt buộc' });
        }

        if (!password || !password_confirmation) {
            return res.status(400).json({ message: 'Mật khẩu và xác nhận mật khẩu là bắt buộc' });
        }

        const result = await resetPasswordService(email, token, password, password_confirmation);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: 'Bad request', error: error.message });
    }
};

const validateToken = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ message: 'Email là bắt buộc' });
        }
        const result = await validateTokenService(email);
        
        // Đảm bảo trả về JSON rõ ràng
        return res.status(200).json({
            token: result.token
        });
    } catch (error) {
        console.error('Error in validateToken:', error);
        return res.status(400).json({ 
            success: false,
            message: error.message || 'Bad request' 
        });
    }
};

module.exports = { register, login, logout, getUser, forgotPassword, resetPassword, validateToken };