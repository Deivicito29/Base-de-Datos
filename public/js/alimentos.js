// Estado global de la aplicación
let state = {
    currentUser: localStorage.getItem('token') ? true : null,
    selectedDate: new Date().toISOString().split('T')[0],
    dailyTotals: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0
    },
    searchFilters: {
        category: 'todos',
        maxCalories: null,
        sortBy: 'nombre'
    }
};

// Elementos del DOM
const elements = {
    searchInput: document.getElementById('searchInput'),
    categoryFilter: document.getElementById('categoryFilter'),
    caloriesFilter: document.getElementById('caloriesFilter'),
    sortBy: document.getElementById('sortBy'),
    searchResults: document.getElementById('searchResults'),
    nutritionCards: document.querySelector('.nutrition-cards'),
    dailyMenu: document.getElementById('dailyMenu'),
    menuDate: document.getElementById('menuDate')
};

// Función para cargar alimentos desde el servidor
async function loadFoods() {
    try {
        const params = new URLSearchParams({
            search: elements.searchInput.value,
            category_id: elements.categoryFilter.value,
            maxCalories: elements.caloriesFilter.value,
            sortBy: elements.sortBy.value
        });

        const response = await fetch(`http://localhost:3002/api/foods?${params}`);
        if (!response.ok) throw new Error('Error al cargar los alimentos');
        
        const foods = await response.json();
        displayFoods(foods);
    } catch (error) {
        console.error('Error:', error);
        elements.searchResults.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error al cargar los alimentos. Por favor, intenta de nuevo.</p>
            </div>
        `;
    }
}



// Función para mostrar los alimentos
function displayFoods(foods) {
    if (!elements.searchResults) return;
    
    elements.searchResults.innerHTML = '';
    
    if (foods.length === 0) {
        elements.searchResults.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>No se encontraron alimentos</p>
            </div>
        `;
        return;
    }

    const foodContainer = document.createElement('div');
    foodContainer.className = 'food-container';

    foods.forEach(food => {
        const card = createFoodCard(food);
        foodContainer.appendChild(card);
    });

    elements.searchResults.appendChild(foodContainer);
}

// Función para crear una tarjeta de alimento
function createFoodCard(food) {
    const card = document.createElement('div');
    card.className = 'food-card';
    
    card.innerHTML = `
        <div class="food-image">
            <img src="${food.image_url || getDefaultImageForCategory(food.category_name)}" 
                 alt="${food.name}" 
                 loading="lazy">
        </div>
        <div class="food-info">
            <h3>${food.name}</h3>
            <div class="nutrition-info">
                <div class="macro-nutrient">
                    <i class="fas fa-fire"></i>
                    <span>${food.calories} kcal</span>
                </div>
                <div class="macro-nutrient">
                    <i class="fas fa-drumstick-bite"></i>
                    <span>${food.protein}g prot</span>
                </div>
                <div class="macro-nutrient">
                    <i class="fas fa-bread-slice"></i>
                    <span>${food.carbs}g carbs</span>
                </div>
                <div class="macro-nutrient">
                    <i class="fas fa-oil-can"></i>
                    <span>${food.fats}g grasas</span>
                </div>
            </div>
            ${state.currentUser ? createMealButtons(food.id) : ''}
        </div>
    `;

    return card;
}

// Función para obtener imagen por defecto según categoría
function getDefaultImageForCategory(category) {
    const defaultImages = {
        'Proteínas': 'img/proteinas.png',
        'Carbohidratos': 'img/carbohidratos.png',
        'Grasas': 'img/grasas.png',
        'Verduras': 'img/verduras.png',
        'Frutas': 'img/manzana.png'
    };
    return defaultImages[category] || 'img/manzana.png';
}

// Función para crear botones de comida
function createMealButtons(foodId) {
    return `
        <div class="meal-buttons">
            <button onclick="addToMenu(${foodId}, 'desayuno')" class="meal-btn">
                <i class="fas fa-sun"></i> Desayuno
            </button>
            <button onclick="addToMenu(${foodId}, 'almuerzo')" class="meal-btn">
                <i class="fas fa-utensils"></i> Almuerzo
            </button>
            <button onclick="addToMenu(${foodId}, 'cena')" class="meal-btn">
                <i class="fas fa-moon"></i> Cena
            </button>
            <button onclick="addToMenu(${foodId}, 'snack')" class="meal-btn">
                <i class="fas fa-cookie"></i> Snack
            </button>
        </div>
    `;
}

// Función para agregar alimento al menú
async function addToMenu(foodId, mealType) {
    if (!state.currentUser) {
        alert('Por favor, inicia sesión para agregar alimentos a tu menú');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3002/api/foods/${foodId}`);
        if (!response.ok) throw new Error('Error al obtener el alimento');
        
        const food = await response.json();
        
        // Actualizar totales diarios
        state.dailyTotals.calories += food.calories;
        state.dailyTotals.protein += parseFloat(food.protein);
        state.dailyTotals.carbs += parseFloat(food.carbs);
        state.dailyTotals.fats += parseFloat(food.fats);
        
        updateNutritionDisplay();
        updateDailyMenu(food, mealType);

        
        // Mostrar mensaje de éxito
        showNotification(`${food.name} agregado a ${mealType}`);
    } catch (error) {
        console.error('Error al agregar alimento:', error);
        showNotification('Error al agregar alimento', 'error');
    }
}


function updateDailyMenu(food, mealType) {
    const mealContainer = document.getElementById(`${mealType}Items`);
    if (!mealContainer) return;

    const mealItem = document.createElement('div');
    mealItem.className = 'meal-item slide-in';
    mealItem.innerHTML = `
        <div class="meal-item-info">
            <img src="${food.image_url || getDefaultImageForCategory(food.category_name)}" 
                 alt="${food.name}">
            <div>
                <h4>${food.name}</h4>
                <p>${food.calories} kcal</p>
            </div>
        </div>
        <button onclick="removeFromMenu('${food.id}', '${mealType}')" class="btn-remove">
            <i class="fas fa-trash"></i>
        </button>
    `;

    mealContainer.appendChild(mealItem);
}

// Función para actualizar display de nutrición
function updateNutritionDisplay() {
    if (!elements.nutritionCards) return;

    const cards = elements.nutritionCards.querySelectorAll('.card');
    cards.forEach(card => {
        const type = card.getAttribute('data-nutrient');
        const value = card.querySelector('.stat-value');
        if (value && type) {
            value.textContent = state.dailyTotals[type];
        }
    });
}

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadFoods();
    
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', debounce(loadFoods, 300));
    }
    if (elements.categoryFilter) {
        elements.categoryFilter.addEventListener('change', loadFoods);
    }
    if (elements.caloriesFilter) {
        elements.caloriesFilter.addEventListener('input', loadFoods);
    }
    if (elements.sortBy) {
        elements.sortBy.addEventListener('change', loadFoods);
    }
    if (elements.menuDate) {
        elements.menuDate.addEventListener('change', () => {
            state.selectedDate = elements.menuDate.value;
            loadDailyMenu();
        });
    }
});
// Función debounce para optimizar búsqueda
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}