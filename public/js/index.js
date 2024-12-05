document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const loginOption = document.getElementById('login-option');
    const registerOption = document.getElementById('register-option');
    const profileOption = document.getElementById('profile-option');
    const logoutOption = document.getElementById('logout-option');

    // Mostrar u ocultar opciones según si el usuario está autenticado
    if (token) {
        loginOption.style.display = 'none';
        registerOption.style.display = 'none';
        profileOption.style.display = 'block';
        logoutOption.style.display = 'block';
    } else {
        loginOption.style.display = 'block';
        registerOption.style.display = 'block';
        profileOption.style.display = 'none';
        logoutOption.style.display = 'none';
    }

    // Añadir evento para cerrar sesión
    logoutOption.addEventListener('click', function () {
        localStorage.removeItem('token');
        alert('Has cerrado sesión');
        window.location.reload();
    });

    const btnLogin = document.querySelector ('.btn-login');

    btnLogin.addEventListener('click', () => {
        window.location.href = 'login.html';
    });
    
    
});

