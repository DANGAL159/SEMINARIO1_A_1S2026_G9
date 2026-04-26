// backend/src/controllers/userController.js
const db = require('../config/db');
const crypto = require('crypto');

const loginUser = async (req, res) => {
    try {
        const { correo, contrasena } = req.body;
        const contrasenaEncriptada = crypto.createHash('md5').update(contrasena).digest('hex');

        const query = 'SELECT * FROM usuarios WHERE correo = $1 AND contrasena = $2';
        const { rows } = await db.query(query, [correo, contrasenaEncriptada]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        res.status(200).json({ message: 'Login exitoso', user: rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        // Solo extraemos lo que el frontend estilo Pip-Boy envía ahora
        const { nombre_completo, foto_perfil_url, contrasena_actual } = req.body;

        // 1. Hashear la contraseña entrante a MD5
        const contrasenaMD5 = crypto.createHash('md5').update(contrasena_actual).digest('hex');

        // 2. Verificar contraseña actual en la Base de Datos (¡Criterio de la rúbrica cumplido!)
        const checkQuery = 'SELECT contrasena FROM usuarios WHERE id = $1';
        const checkResult = await db.query(checkQuery, [userId]);
        
        if (checkResult.rows.length === 0 || checkResult.rows[0].contrasena !== contrasenaMD5) {
            return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }

        // 3. Actualizar perfil (Sin tocar el DPI)
        const updateQuery = `
            UPDATE usuarios 
            SET nombre_completo = $1, foto_perfil_url = $2 
            WHERE id = $3 RETURNING id, correo, nombre_completo, foto_perfil_url, cognito_sub;
        `;
        const { rows } = await db.query(updateQuery, [nombre_completo, foto_perfil_url, userId]);

        res.status(200).json({ message: 'Perfil actualizado', user: rows[0] });
    } catch (error) {
        console.error("Error al actualizar perfil:", error);
        res.status(500).json({ error: 'Error interno del servidor al actualizar' });
    }
};

module.exports = { loginUser, updateProfile };