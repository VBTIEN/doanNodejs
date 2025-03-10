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

const register = async (req, res) => {
    try {
        const { name, email, password, role_code } = req.body;

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

        const { user, type } = await findUserByEmail(email);
        if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
        }

        const code = user[type === 'teacher' ? 'teacher_code' : 'student_code'];
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

module.exports = { register, login, logout, getUser };