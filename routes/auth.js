const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { pool } = require('../db');
const router = express.Router();

router.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json(result.rows);
    } catch (error) {
        console.error("Error en la prueba de conexión:", error);
        res.status(500).json({ message: 'Error al conectar a la base de datos' });
    }
});

// Ruta de registro
router.post('/register', async (req, res) => {
    const { nombre, email, password } = req.body;

    try {
        console.log("Datos recibidos en /register:", { nombre, email, password });

        const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        console.log("Resultado de userExist:", userExist.rows);

        if (userExist.rows.length > 0) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Contraseña encriptada:", hashedPassword);

        const insertUser = await pool.query(
            'INSERT INTO users (nombre, email, password) VALUES ($1, $2, $3)',
            [nombre, email, hashedPassword]
        );
        console.log("Resultado de insertUser:", insertUser);

        res.status(201).json({ message: 'Usuario registrado con éxito' });
    } catch (error) {
        console.error("Error en el registro:", error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Ruta de inicio de sesión
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        console.log("Resultado de user:", user.rows);

        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'Credenciales incorrectas' });
        }

        // Verifica la contraseña si no es nula
        if (user.rows[0].password && !(await bcrypt.compare(password, user.rows[0].password))) {
            return res.status(400).json({ message: 'Credenciales incorrectas' });
        }

        const token = jwt.sign(
            { id: user.rows[0].id, email: user.rows[0].email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ token });
    } catch (error) {
        console.error("Error en el inicio de sesión:", error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});


// Ruta para obtener el perfil del usuario
router.get('/perfil', async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1]; 
    
    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    // Verificar el token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token no válido' });
        }

        // Obtener la información del usuario desde la base de datos
        const user = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);

        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Enviar la información del perfil
        res.json({
            nombre: user.rows[0].nombre,
            email: user.rows[0].email,
            avatar: user.rows[0].avatar || ''  
        });
    });
});


// Rutas de autenticación con Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/index.html');
});

module.exports = router;
