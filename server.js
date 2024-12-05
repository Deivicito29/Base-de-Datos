const express = require('express');
const session = require('express-session');
const passport = require('passport');
const authRoutes = require('./routes/auth');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3002;
const helmet = require('helmet');
const foodsRouter = require('./routes/foods');


const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');


require('./config/passport-setup');
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

// Middleware

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
 
    }
}));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));




app.get('/api/perfil', verificarToken, async (req, res) => {
    try {
        const { id, email } = req.user;
        const user = await pool.query(
            'SELECT nombre, email, bio, avatar, portada FROM users WHERE id = $1',
            [id]
        );
        
        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({
            nombre: user.rows[0].nombre,
            email: user.rows[0].email,
            bio: user.rows[0].bio || '',
            avatar: user.rows[0].avatar || '',
            portada: user.rows[0].portada || ''
        });
    } catch (error) {
        console.error('Error al obtener el perfil:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});



// Ruta para guardar el avatar
app.post('/api/guardarAvatar', verificarToken, async (req, res) => {
    const { avatar } = req.body;
    const userId = req.user.id;

    try {
        const result = await pool.query(
            'UPDATE users SET avatar = $1 WHERE id = $2 RETURNING *',
            [avatar, userId]
        );

        if (result.rows.length > 0) {
            res.json({ success: true, message: 'Avatar actualizado correctamente' });
        } else {
            res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('Error al guardar el avatar:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

// Ruta para guardar la portada
app.post('/api/guardarPortada', verificarToken,async (req, res) => {
    const { portada } = req.body;
    const userId = req.user.id;

    try {
        const result = await pool.query(
            'UPDATE users SET portada = $1 WHERE id = $2 RETURNING *',
            [portada, userId]
        );

        if (result.rows.length > 0) {
            res.json({ success: true, message: 'Portada actualizada correctamente' });
        } else {
            res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('Error al guardar la portada:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

app.post('/api/actualizarPerfil', verificarToken, async (req, res) => {
    const { bio, avatar, portada, stats, calculatorResults } = req.body;
    const userId = req.user.id;

    const client = await pool.connect(); // Usamos una transacción para asegurarnos de que ambos cambios se realicen
    try {
        await client.query('BEGIN'); // Inicia la transacción

        // Actualizar los datos del usuario en la tabla `users`
        const userResult = await client.query(
            `UPDATE users 
             SET bio = $1, avatar = $2, portada = $3 
             WHERE id = $4 
             RETURNING *`,
            [bio, avatar, portada, userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        // Actualizar las estadísticas del usuario en la tabla `user_stats`
        const statsResult = await client.query(
            `UPDATE user_stats 
             SET peso = $1, altura = $2, objetivo_peso = $3, imc = $4, actividad = $5, edad = $6, fecha_registro = $7 
             WHERE user_id = $8 
             RETURNING *`,
            [stats.peso, stats.altura, stats.objetivo_peso, stats.imc, stats.actividad, stats.edad, new Date(), userId] // Asumimos que fecha_registro es la fecha actual
        );

        if (statsResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Estadísticas no encontradas para este usuario' });
        }

        await client.query('COMMIT'); // Confirmar la transacción

        // Devolver una respuesta exitosa con los datos actualizados
        res.json({
            success: true,
            message: 'Perfil y estadísticas actualizadas correctamente',
            user: userResult.rows[0],
            stats: statsResult.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK'); // Deshacer ambos cambios si algo sale mal
        console.error('Error al actualizar perfil y estadísticas:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    } finally {
        client.release(); // Liberar la conexión del cliente
    }
});



function verificarToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token no válido' });
        }
        req.user = decoded; // Decodificamos y almacenamos
        next();
    });
}

app.use(session({
    secret: process.env.JWT_SECRET || 'alexander', 
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());
app.use('/auth', authRoutes);

app.use('/api/foods', foodsRouter); 







app.get('/foods', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM foods');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener alimentos');
    }
});
  
// Ruta para obtener recetas
app.get('/recipes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM recipes');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener recetas');
    }
});

// Ruta principal
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Ruta para iniciar sesión con Google
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Ruta de callback de Google
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/index.html');
});
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});


// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);

});
