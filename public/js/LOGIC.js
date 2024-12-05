// Funciones de autenticación y UI
document.addEventListener('DOMContentLoaded', function () {
  const token = localStorage.getItem('token');
  const loginOption = document.getElementById('login-option');
  const registerOption = document.getElementById('register-option');
  const profileOption = document.getElementById('profile-option');
  const logoutOption = document.getElementById('logout-option');

  if (token) {
      loginOption.style.display = 'none';
      registerOption.style.display = 'none';
      profileOption.style.display = 'block';
      logoutOption.style.display = 'block';
      loadUserCalculatorData();
  } else {
      loginOption.style.display = 'block';
      registerOption.style.display = 'block';
      profileOption.style.display = 'none';
      logoutOption.style.display = 'none';
  }

  logoutOption.addEventListener('click', function () {
      localStorage.removeItem('token');
      localStorage.removeItem('calculatorData');
      window.location.href = 'login.html';
  });
});

// Elementos del formulario
const form = document.getElementById('calculator-form');
const button = document.getElementById('calcular-btn');
const inputs = form.querySelectorAll('input, select');

// Validación del formulario
function checkFormValidity() {
  let allFilled = true;
  inputs.forEach(input => {
      if (input.type === "number") {
          const value = parseFloat(input.value);
          if (isNaN(value) || value <= 0) {
              allFilled = false;
          }
      } else if (!input.value) {
          allFilled = false;
      }
  });

  button.disabled = !allFilled;
  button.style.backgroundColor = allFilled ? "#C8102E" : "#ddd";
  button.style.cursor = allFilled ? "pointer" : "not-allowed";
}

// Gestión de datos
function saveCalculatorData(data) {
  if (localStorage.getItem('token')) {
      localStorage.setItem('calculatorData', JSON.stringify({
          ...data,
          timestamp: new Date().toISOString()
      }));
      updateUserProfile(data);
  }
}

function loadUserCalculatorData() {
  const savedData = localStorage.getItem('calculatorData');
  if (savedData) {
      const data = JSON.parse(savedData);
      Object.entries({
          'sexo': data.sexo,
          'edad': data.edad,
          'peso': data.peso,
          'altura': data.altura,
          'actividad': data.actividad
      }).forEach(([id, value]) => {
          const element = document.getElementById(id);
          if (element) element.value = value;
      });
      calculateAndDisplay();
  }
}

function updateUserProfile(data) {
  const userState = {
      stats: {
          peso: parseFloat(data.peso),
          altura: parseFloat(data.altura),
          imc: calculateBMI(data.peso, data.altura),
          actividad: getActivityLabel(data.actividad),
          edad: parseInt(data.edad)
      },
      calculatorResults: {
          tmb: data.tmb,
          tdee: data.tdee,
          macros: data.macros
      }
  };
  
  const currentState = JSON.parse(localStorage.getItem('userState') || '{}');
  localStorage.setItem('userState', JSON.stringify({
      ...currentState,
      ...userState
  }));
}

// Cálculos
function calculateBMI(peso, altura) {
  const alturaMetros = altura / 100;
  return (peso / (alturaMetros * alturaMetros)).toFixed(1);
}

function getActivityLabel(activityValue) {
  return {
      '1.2': 'Sedentario',
      '1.375': 'Ligero',
      '1.55': 'Moderado',
      '1.725': 'Activo',
      '1.9': 'Muy activo'
  }[activityValue] || 'No especificado';
}

function calculateAndDisplay() {
  const formData = {
      sexo: document.getElementById('sexo').value,
      edad: parseInt(document.getElementById('edad').value),
      peso: parseFloat(document.getElementById('peso').value),
      altura: parseInt(document.getElementById('altura').value),
      actividad: parseFloat(document.getElementById('actividad').value)
  };

  if (Object.values(formData).some(value => !value || value <= 0)) {
      alert("Por favor, verifica todos los campos.");
      return;
  }

  const tmb = formData.sexo === 'hombre'
      ? 88.362 + (13.397 * formData.peso) + (4.799 * formData.altura) - (5.677 * formData.edad)
      : 447.593 + (9.247 * formData.peso) + (3.098 * formData.altura) - (4.330 * formData.edad);

  const tdee = tmb * formData.actividad;
  const macros = {
      proteinas: ((tdee * 0.25) / 4).toFixed(2),
      carbohidratos: ((tdee * 0.45) / 4).toFixed(2),
      grasas: ((tdee * 0.30) / 9).toFixed(2)
  };

  // Actualizar UI
  document.getElementById('tmb').textContent = `TMB (TASA METABÓLICA BASAL): ${tmb.toFixed(2)} kcal/día`;
  document.getElementById('tdee').textContent = `TDEE (GASTO ENERGÉTICO TOTAL DIARIO): ${tdee.toFixed(2)} kcal/día`;
  document.getElementById('macros').innerHTML = `
      <div class="macro-item">
          <img src="img/proteinas.png" alt="proteinas">
          <strong>Proteínas:</strong> ${macros.proteinas} g/día
      </div>
      <div class="macro-item">
          <img src="img/carbohidratos.png" alt="carbohidratos">
          <strong>Carbohidratos:</strong> ${macros.carbohidratos} g/día
      </div>
      <div class="macro-item">
          <img src="img/grasas.png" alt="grasas">
          <strong>Grasas:</strong> ${macros.grasas} g/día
      </div>
  `;

  saveCalculatorData({
      ...formData,
      tmb: tmb.toFixed(2),
      tdee: tdee.toFixed(2),
      macros
  });

  document.getElementById('resultados').style.display = 'block';
}

// Event Listeners
inputs.forEach(input => {
  input.addEventListener('input', checkFormValidity);
});

form.addEventListener('submit', function(event) {
  event.preventDefault();
  calculateAndDisplay();
});