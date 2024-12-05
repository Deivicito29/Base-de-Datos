document.getElementById('register-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: username, email, password })
        });

        if (response.ok) {
            alert('Registro exitoso');
            window.location.href = 'login.html'; // Redirigir a la página de inicio de sesión
        } else {
            const errorData = await response.json();
            alert(`Error en el registro: ${errorData.message || 'Inténtalo de nuevo'}`);
        }
    } catch (error) {
        console.error('Error al enviar la solicitud:', error);
        alert('Error al enviar la solicitud, por favor intenta más tarde.');
    }
});
