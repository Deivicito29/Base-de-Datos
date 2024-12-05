const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool } = require('../db');

passport.serializeUser((user, done) => {
    console.log('Serializando usuario:', user);
    done(null, user.id); 
});


passport.deserializeUser(async (id, done) => {
    try {
        const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        console.log('Deserializando usuario:', user.rows[0]);
        done(null, user.rows[0]); // Retorna el usuario encontrado
    } catch (error) {
        console.error('Error en la deserialización:', error);
        done(error, null);
    }
});
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
    scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('Perfil de Google:', profile);
        const user = await pool.query('SELECT * FROM users WHERE google_id = $1', [profile.id]);
        if (user.rows.length > 0) {
            done(null, user.rows[0]);
        } else {
            const newUser = await pool.query(
                'INSERT INTO users (nombre, email, google_id) VALUES ($1, $2, $3) RETURNING *',
                [profile.displayName, profile.emails[0].value, profile.id]
            );
            done(null, newUser.rows[0]);
        }
    } catch (error) {
        done(error, null);
    }
}));
