/* ==========================================
   MS BAR AND LOUNGE - ADMIN LOGIN LOGIC
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    // 1. Check if already logged in
    if (sessionStorage.getItem('ms_admin_logged_in') === 'true') {
        window.location.href = 'index.html';
    }

    // 2. Handle Login Submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        // Default Credentials (In a real app, this would be a server-side check)
        const ADMIN_USER = 'MS Bar';
        const ADMIN_PASS = 'MS';

        if (username === ADMIN_USER && password === ADMIN_PASS) {
            // Success
            sessionStorage.setItem('ms_admin_logged_in', 'true');
            sessionStorage.setItem('ms_admin_user', username);
            window.location.href = 'index.html';
        } else {
            // Failure
            errorMessage.style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();
        }
    });

    // Hide error when user starts typing again
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('input', () => {
            errorMessage.style.display = 'none';
        });
    });
});