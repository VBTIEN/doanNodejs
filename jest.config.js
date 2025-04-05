module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./tests/setup.js'], // File setup để kết nối MongoDB
    testTimeout: 10000, // Tăng timeout cho các test bất đồng bộ
};