-- Tabla de categorías de alimentos
CREATE TABLE food_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de alimentos
CREATE TABLE foods (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES food_categories(id),
    name VARCHAR(100) NOT NULL,
    calories INTEGER NOT NULL,
    protein DECIMAL(5,2) NOT NULL,
    carbs DECIMAL(5,2) NOT NULL,
    fats DECIMAL(5,2) NOT NULL,
    image_url TEXT,
    serving_size INTEGER NOT NULL DEFAULT 100, -- en gramos
    serving_unit VARCHAR(20) DEFAULT 'g',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de recetas
CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    preparation_time INTEGER, -- en minutos
    cooking_time INTEGER, -- en minutos
    servings INTEGER,
    instructions TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de ingredientes de recetas
CREATE TABLE recipe_ingredients (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER REFERENCES recipes(id),
    food_id INTEGER REFERENCES foods(id),
    quantity DECIMAL(8,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos de ejemplo para categorías
INSERT INTO food_categories (name, description) VALUES
('Proteínas', 'Alimentos ricos en proteínas como carnes, pescados y legumbres'),
('Carbohidratos', 'Alimentos ricos en carbohidratos como arroz, pasta y cereales'),
('Frutas', 'Frutas frescas y sus derivados'),
('Verduras', 'Verduras y hortalizas'),
('Lácteos', 'Productos lácteos y derivados');

-- Datos de ejemplo para alimentos
INSERT INTO foods (category_id, name, calories, protein, carbs, fats, image_url, serving_size) VALUES
(1, 'Pollo a la Parrilla', 165, 31, 0, 3.6, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d', 100),
(2, 'Arroz Integral', 216, 4.5, 45, 1.8, 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6', 100),
(3, 'Manzana', 95, 0.5, 25, 0.3, 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2', 100),
(4, 'Ensalada Mediterránea', 320, 12, 24, 22, 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe', 250);

-- Datos de ejemplo para recetas
INSERT INTO recipes (name, description, preparation_time, cooking_time, servings, instructions, image_url) VALUES
('Arroz con Pollo', 'Delicioso arroz con pollo estilo casero', 15, 45, 4, 
'1. Sazonar el pollo\n2. Sofreír el pollo\n3. Agregar el arroz\n4. Cocinar a fuego lento', 
'https://images.unsplash.com/photo-1594221708779-94832f4320d1');

-- Datos de ejemplo para ingredientes de recetas
INSERT INTO recipe_ingredients (recipe_id, food_id, quantity, unit) VALUES
(1, 1, 400, 'g'), -- Pollo para el arroz con pollo
(1, 2, 300, 'g'); -- Arroz para el arroz con pollo

-- Índices para mejorar el rendimiento
CREATE INDEX idx_foods_category ON foods(category_id);
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_food ON recipe_ingredients(food_id);
CREATE INDEX idx_foods_name ON foods(name);
CREATE INDEX idx_recipes_name ON recipes(name);

-- Trigger para actualizar el timestamp de última modificación
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_foods_updated_at
    BEFORE UPDATE ON foods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at
    BEFORE UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();