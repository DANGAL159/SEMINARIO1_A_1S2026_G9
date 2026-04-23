const { CognitoIdentityProviderClient, SignUpCommand, AdminInitiateAuthCommand, AdminConfirmSignUpCommand } = require("@aws-sdk/client-cognito-identity-provider");
const { RekognitionClient, CompareFacesCommand } = require("@aws-sdk/client-rekognition");
const jwt = require("jsonwebtoken"); 
const db = require('../config/db');

const cognito = new CognitoIdentityProviderClient({ region: "us-east-1" });
const rekognition = new RekognitionClient({ region: "us-east-1" });

// Secreto para el token facial (En producción esto va en el .env)
const JWT_SECRET = process.env.JWT_SECRET || "Semisocial_G9_Super_Secret_Key"; 

// ==========================================
// 1. REGISTRO (CON COGNITO SUB, SIN PASSWORD EN BD)
// ==========================================
const registerUser = async (req, res) => {
    const { correo, contrasena, nombre_completo, dpi, foto_perfil_url } = req.body;
    try {
        // 1. Crear usuario en Cognito
        const signUpCommand = new SignUpCommand({
            ClientId: process.env.COGNITO_CLIENT_ID,
            Username: correo,
            Password: contrasena,
            UserAttributes: [{ Name: "email", Value: correo }]
        });
        const cognitoRes = await cognito.send(signUpCommand);
        
        // 2. ¡Atrapamos el SUB que genera AWS!
        const cognitoSub = cognitoRes.UserSub; 

        // 3. Auto-confirmamos al usuario
        const confirmCommand = new AdminConfirmSignUpCommand({
            UserPoolId: process.env.COGNITO_POOL_ID,
            Username: correo
        });
        await cognito.send(confirmCommand);

        // 4. Guardamos en BD. ¡Nota que ya NO enviamos la contraseña!
        const query = 'INSERT INTO usuarios (correo, nombre_completo, dpi, foto_perfil_url, cognito_sub) VALUES ($1, $2, $3, $4, $5) RETURNING id, correo, nombre_completo, foto_perfil_url';
        const { rows } = await db.query(query, [correo, nombre_completo, dpi, foto_perfil_url, cognitoSub]);
        
        res.status(201).json({ message: 'Usuario registrado exitosamente', user: rows[0] });
    } catch (error) {
        console.error("Error en Registro:", error);
        res.status(400).json({ error: error.message || 'Error al registrar usuario' });
    }
};

// ==========================================
// 2. LOGIN TRADICIONAL
// ==========================================
const loginUser = async (req, res) => {
    const { correo, contrasena } = req.body;
    try {
        // 1. AWS valida que la contraseña sea correcta
        const authCommand = new AdminInitiateAuthCommand({
            AuthFlow: "ADMIN_NO_SRP_AUTH",
            ClientId: process.env.COGNITO_CLIENT_ID,
            UserPoolId: process.env.COGNITO_POOL_ID,
            AuthParameters: { USERNAME: correo, PASSWORD: contrasena }
        });
        const cognitoAuth = await cognito.send(authCommand);

        // 2. Buscamos al usuario en la BD (ahora validando que exista)
        const { rows } = await db.query('SELECT id, correo, nombre_completo, foto_perfil_url, cognito_sub FROM usuarios WHERE correo = $1', [correo]);
        if (rows.length === 0) return res.status(404).json({ error: 'Usuario en AWS pero no en DB' });

        res.status(200).json({ 
            message: 'Login exitoso', 
            token: cognitoAuth.AuthenticationResult.IdToken, 
            user: rows[0] 
        });
    } catch (error) {
        console.error("Login Error Cognito:", error);
        res.status(401).json({ error: 'Credenciales inválidas' });
    }
};

// ==========================================
// 3. LOGIN FACIAL (REKOGNITION COMPARE FACES)
// ==========================================
const loginFacial = async (req, res) => {
    const { correo, imagen_base64 } = req.body; // La cámara del frontend envía esto en base64
    
    try {
        // 1. Traer la foto de perfil oficial del usuario desde la BD
        const { rows } = await db.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
        if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        
        const usuario = rows[0];

        // 2. Extraer solo el nombre del archivo del S3 url (ej: de https://bucket.../foto.jpg a foto.jpg)
        const s3Key = usuario.foto_perfil_url.split('/').pop();
        const bucketName = process.env.S3_BUCKET_NAME;

        // 3. Limpiar la cabecera del base64 que envía HTML5 y convertir a Buffer de Bytes
        const base64Data = imagen_base64.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // 4. ¡Magia! Comparamos el S3 oficial contra la cámara en tiempo real
        const command = new CompareFacesCommand({
            SourceImage: { S3Object: { Bucket: bucketName, Name: s3Key } },
            TargetImage: { Bytes: imageBuffer },
            SimilarityThreshold: 85 // Exigimos mínimo un 85% de similitud para dejarlo pasar
        });

        const response = await rekognition.send(command);

        if (response.FaceMatches && response.FaceMatches.length > 0) {
            const similitud = response.FaceMatches[0].Similarity;

            // Como fue biométrico, emitimos un JWT nuestro
            const token = jwt.sign({ id: usuario.id, correo: usuario.correo }, JWT_SECRET, { expiresIn: '8h' });

            res.status(200).json({ 
                message: `Identidad verificada (${similitud.toFixed(1)}% de precisión)`, 
                token: token, 
                user: { id: usuario.id, correo: usuario.correo, nombre_completo: usuario.nombre_completo, foto_perfil_url: usuario.foto_perfil_url }
            });
        } else {
            res.status(401).json({ error: 'El rostro no coincide con la base de datos' });
        }

    } catch (error) {
        console.error("Error en Compare Faces:", error);
        res.status(500).json({ error: 'No se detectó un rostro claro o falló el servicio' });
    }
};

module.exports = { registerUser, loginUser, loginFacial };