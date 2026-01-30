// Authentication Logic
const Auth = {
    login: (role, credentials) => {
        // Simple hardcoded checks
        if (role === 'admin') {
            if (credentials.email === 'admin@hostelease.com' && credentials.password === 'admin123') {
                const user = { name: "Warden Sahab", role: 'admin', email: credentials.email };
                sessionStorage.setItem('current_user', JSON.stringify(user));
                return { success: true, user };
            }
        } else if (role === 'student') {
            const students = Storage.getAll('students');
            const student = students.find(s => s.rollNo === credentials.rollNo && credentials.password === '123456');
            if (student) {
                const user = { ...student, role: 'student' };
                sessionStorage.setItem('current_user', JSON.stringify(user));
                return { success: true, user };
            }
        }
        return { success: false, message: "Invalid credentials. Try admin@hostelease.com / admin123 or STUD-2024-001 / 123456" };
    },

    getCurrentUser: () => {
        return JSON.parse(sessionStorage.getItem('current_user'));
    },

    logout: () => {
        sessionStorage.removeItem('current_user');
        window.location.reload();
    },

    isLoggedIn: () => {
        return sessionStorage.getItem('current_user') !== null;
    }
};

// Toggle Password visibility
document.querySelectorAll('.toggle-password').forEach(icon => {
    icon.addEventListener('click', function () {
        const input = this.previousElementSibling;
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
});
