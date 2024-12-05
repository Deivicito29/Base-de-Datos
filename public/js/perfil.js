// Estado inicial del usuario
let userState = {
    avatar: '',
    portada: '',
    bio: '',
    nombre: '',
    email: '',
    userId: '',
    stats: {
        peso: 0,
        altura: 0,
        objetivo: 65,
        progreso: 0,
        imc: 0,
        actividad: '',
        edad: 0
    },
    calculatorResults: {
        tmb: 0,
        tdee: 0,
        macros: {
            proteinas: 0,
            carbohidratos: 0,
            grasas: 0
        }
    }
};

// Inicialización
document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('Token no encontrado');
        window.location.href = 'login.html';
        return;
    }
    
    // Decodificar el token para obtener el ID del usuario
    try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        userState.userId = tokenData.id;
    } catch (error) {
        console.error('Error al decodificar el token:', error);
    }

    // Actualizar UI del menú
    updateMenuUI(token);
    
    // Cargar datos del usuario desde el servidor
    await loadUserData(token);
    
    // Cargar datos guardados localmente
    cargarDatosGuardados();
    setupEventListeners();
    setupObjetivoEditable();
});

// Actualizar UI del menú
function updateMenuUI(token) {
    const loginOption = document.getElementById('login-option');
    const registerOption = document.getElementById('register-option');
    const profileOption = document.getElementById('profile-option');
    const logoutOption = document.getElementById('logout-option');

    if (token) {
        loginOption.style.display = 'none';
        registerOption.style.display = 'none';
        profileOption.style.display = 'block';
        logoutOption.style.display = 'block';
    }

    // Configurar logout
    logoutOption.addEventListener('click', async function(e) {
        e.preventDefault();
        await guardarDatosEnServidor();
        localStorage.removeItem('token');
        localStorage.removeItem('userstate')
        localStorage.removeItem('calculatorData');
        window.location.href = 'login.html';
    });
}

// Cargar datos del usuario desde el servidor
async function loadUserData(token) {
    try {
        const response = await fetch('/api/perfil', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            userState = {
                ...userState,
                nombre: data.nombre,
                email: data.email,
                bio: data.bio || '',
                avatar: data.avatar || '',
                portada: data.portada || '',
                stats: data.stats || userState.stats,
                calculatorResults: data.calculatorResults || userState.calculatorResults
            };
            actualizarUI();
        } else {
            console.error('Error al cargar datos del usuario:', await response.text());
        }
    } catch (error) {
        console.error('Error al cargar datos del servidor:', error);
    }
}

// Configurar edición de peso objetivo
function setupObjetivoEditable() {
    const objetivoCard = document.querySelector('[data-stat-type="objetivo"]');
    if (objetivoCard) {
        const editButton = document.createElement('button');
        editButton.className = 'objetivo-edit';
        editButton.innerHTML = '<i class="fas fa-pencil-alt"></i>';
        editButton.onclick = editarObjetivo;
        objetivoCard.appendChild(editButton);
    }
}

function editarObjetivo() {
    const nuevoObjetivo = prompt('Ingrese su peso objetivo (en kg):', userState.stats.objetivo);
    if (nuevoObjetivo && !isNaN(nuevoObjetivo)) {
        userState.stats.objetivo = parseFloat(nuevoObjetivo);
        guardarDatos();
        actualizarUI();
    }
}

// Cargar datos guardados
function cargarDatosGuardados() {
    const savedState = localStorage.getItem(`userState_${userState.userId}`);
    const calculatorData = localStorage.getItem('calculatorData');
    
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Solo actualizar si los datos pertenecen al usuario actual
        if (parsedState.userId === userState.userId) {
            userState = {...userState, ...parsedState};
        }
    }
    
    if (calculatorData) {
        const data = JSON.parse(calculatorData);
        userState.stats = {
            ...userState.stats,
            peso: parseFloat(data.peso) || 0,
            altura: parseFloat(data.altura) || 0,
            imc: calculateBMI(data.peso, data.altura),
            actividad: getActivityLabel(data.actividad),
            edad: parseInt(data.edad) || 0
        };
        userState.calculatorResults = {
            tmb: parseFloat(data.tmb) || 0,
            tdee: parseFloat(data.tdee) || 0,
            macros: data.macros || {
                proteinas: 0,
                carbohidratos: 0,
                grasas: 0
            }
        };
    }
    
    actualizarUI();
}

// Gestión de eventos
function setupEventListeners() {
    // Avatar
    document.getElementById('cambiarAvatar')?.addEventListener('click', () => {
        document.getElementById('inputAvatar')?.click();
    });

    document.getElementById('inputAvatar')?.addEventListener('change', handleAvatarChange);

    // Portada
    document.getElementById('cambiarPortada')?.addEventListener('click', () => {
        document.getElementById('inputPortada')?.click();
    });

    document.getElementById('inputPortada')?.addEventListener('change', handlePortadaChange);

    // Campos editables
    document.querySelectorAll('[data-field]').forEach(element => {
        element.addEventListener('click', () => editarCampo(element));
    });
}

// Manejadores de eventos
async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Image = e.target?.result?.toString() || '';
            
            try {
                const response = await fetch('/api/guardarAvatar', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ avatar: base64Image })
                });

                if (response.ok) {
                    userState.avatar = base64Image;
                    document.getElementById('avatarImage').src = base64Image;
                    await guardarDatosEnServidor();
                    guardarDatos();
                } else {
                    console.error('Error al guardar el avatar');
                    alert('Error al guardar la imagen de perfil');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al procesar la imagen de perfil');
            }
        };
        reader.readAsDataURL(file);
    }
}

// Update the handlePortadaChange function
async function handlePortadaChange(event) {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Image = e.target?.result?.toString() || '';
            
            try {
                const response = await fetch('/api/guardarPortada', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ portada: base64Image })
                });

                if (response.ok) {
                    userState.portada = base64Image;
                    document.querySelector('.perfil-usuario-portada').style.backgroundImage = `url(${base64Image})`;
                    await guardarDatosEnServidor();
                    guardarDatos();
                } else {
                    console.error('Error al guardar la portada');
                    alert('Error al guardar la imagen de portada');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al procesar la imagen de portada');
            }
        };
        reader.readAsDataURL(file);
    }
}


// Actualizar interfaz
function actualizarUI() {
    // Información básica
    document.getElementById('avatarImage').src = userState.avatar ;
    document.querySelector('.perfil-usuario-portada').style.backgroundImage = 
        `url(${userState.portada || 'img/default-cover.jpg'})`;
    document.getElementById('descripcion-bio').textContent = 
        userState.bio || 'Escribe algo sobre ti...';
    document.getElementById('perfilNombre').textContent = 
        userState.nombre || 'Nombre de usuario';
    document.getElementById('perfilCorreo').textContent = 
        userState.email || 'usuario@email.com';
    document.getElementById('edadusuario').textContent = 
        userState.stats.edad || 'No especificado';

    actualizarEstadisticas();
    actualizarBarrasProgreso();
}

function actualizarEstadisticas() {
    const stats = document.querySelectorAll('.stat-card');
    stats.forEach(stat => {
        const type = stat.getAttribute('data-stat-type');
        const valueElement = stat.querySelector('.stat-value');
        if (!valueElement) return;

        switch(type) {
            case 'peso':
                valueElement.textContent = userState.stats.peso ? `${userState.stats.peso}kg` : '--';
                break;
            case 'altura':
                valueElement.textContent = userState.stats.altura ? `${userState.stats.altura}cm` : '--';
                break;
            case 'imc':
                valueElement.textContent = userState.stats.imc || '--';
                break;
            case 'actividad':
                valueElement.textContent = userState.stats.actividad || '--';
                break;
            case 'tmb':
                valueElement.textContent = userState.calculatorResults.tmb ? 
                    `${userState.calculatorResults.tmb} kcal` : '--';
                break;
            case 'tdee':
                valueElement.textContent = userState.calculatorResults.tdee ? 
                    `${userState.calculatorResults.tdee} kcal` : '--';
                break;
            case 'objetivo':
                valueElement.textContent = `${userState.stats.objetivo}kg`;
                break;
        }
    });
}

function actualizarBarrasProgreso() {
    if (userState.stats.peso && userState.stats.objetivo) {
        const progreso = Math.min(100, Math.max(0, 
            (userState.stats.peso / userState.stats.objetivo) * 100));
        const progressBar = document.querySelector('.progress-bar');
        const progressValue = document.querySelector('.progress-value');
        if (progressBar && progressValue) {
            progressBar.style.width = `${progreso}%`;
            progressBar.setAttribute('data-percent', progreso);
            progressValue.textContent = `${progreso.toFixed(1)}%`;
        }
    }
}

// Utilidades
function calculateBMI(peso, altura) {
    if (!peso || !altura) return 0;
    const alturaMetros = altura / 100;
    return (peso / (alturaMetros * alturaMetros)).toFixed(1);
}

function getActivityLabel(activityValue) {
    const labels = {
        '1.2': 'Sedentario',
        '1.375': 'Ligero',
        '1.55': 'Moderado',
        '1.725': 'Activo',
        '1.9': 'Muy activo'
    };
    return labels[activityValue] || 'No especificado';
}

async function guardarDatosEnServidor() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No se encontró un token de sesión.');
        return;
    }

    try {
        // Enviar los datos actualizados al servidor
        const response = await fetch('/api/actualizarPerfil', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bio: userState.bio,
                avatar: userState.avatar,
                portada: userState.portada,
                stats: userState.stats,
                calculatorResults: userState.calculatorResults
            })
        });

        if (!response.ok) {
            throw new Error('Error al guardar los datos en el servidor.');
        }

        console.log('Datos guardados correctamente en el servidor.');
    } catch (error) {
        console.error('Error al guardar datos en el servidor:', error);
    }
}


function guardarDatos() {
    localStorage.setItem('userState', JSON.stringify(userState));
}

function editarCampo(element) {
    const field = element.getAttribute('data-field');
    if (!field) return;

    // Hacer el elemento editable
    element.contentEditable = 'true';
    element.classList.add('editing');
    element.focus();

    // Seleccionar todo el texto
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    async function guardarCambio() {
        element.contentEditable = 'false';
        element.classList.remove('editing');
        const newValue = element.textContent.trim();
        
        if (field.includes('.')) {
            const [obj, prop] = field.split('.');
            userState[obj][prop] = newValue;
        } else {
            userState[field] = newValue;
        }
        
        await guardarDatosEnServidor();
        guardarDatos();
        actualizarUI();
    }

    element.addEventListener('blur', guardarCambio, { once: true });
    element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            element.blur();
        }
    });
}