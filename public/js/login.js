document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    console.log('Intentando iniciar sesión con:', email, password);

    
    const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    console.log('Respuesta del servidor:', data); 

    if (response.ok) {
        localStorage.setItem('token', data.token);
        console.log('Token guardado:', data.token)
        alert('Inicio de sesión exitoso');
        window.location.href = 'index.html'; 
    } else {
        alert('Error en el inicio de sesión: ' + data.message); // Mostrar mensaje de error
    }
    
    const btnLogin = document.querySelector ('.btn-login');

    btnLogin.addEventListener('click',); () => {
        window.location.href = 'login.html';
    }
});
