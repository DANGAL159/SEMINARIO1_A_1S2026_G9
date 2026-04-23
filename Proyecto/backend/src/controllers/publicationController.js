// backend/src/controllers/publicationController.js
const { RekognitionClient, DetectLabelsCommand } = require("@aws-sdk/client-rekognition");
const { TranslateClient, TranslateTextCommand } = require("@aws-sdk/client-translate");
const db = require('../config/db');

const rekognition = new RekognitionClient({ region: "us-east-1" });
const translate = new TranslateClient({ region: "us-east-1" });

const createPublication = async (req, res) => {
    // Ya no dependemos del s3_filename que manda el frontend, usamos la URL real
    const { id_usuario, imagen_url, descripcion } = req.body; 
    
    try {
        // 1. Guardar publicación en BD
        const pubQuery = 'INSERT INTO publicaciones (id_usuario, imagen_url, descripcion) VALUES ($1, $2, $3) RETURNING id';
        const pubResult = await db.query(pubQuery, [id_usuario, imagen_url, descripcion]);
        const id_publicacion = pubResult.rows[0].id;

        // 2. Extraer el S3 Key real directo de la URL (Ej: "Fotos_Publicadas/foto123.jpg")
        const urlObj = new URL(imagen_url);
        const s3KeyReal = decodeURIComponent(urlObj.pathname.substring(1));
        const bucketName = process.env.S3_BUCKET_NAME;

        // 3. Analizar imagen con Rekognition
        const params = {
            Image: { S3Object: { Bucket: bucketName, Name: s3KeyReal } },
            MaxLabels: 5,
            MinConfidence: 75
        };
        const command = new DetectLabelsCommand(params);
        const response = await rekognition.send(command);

        // 4. Guardar etiquetas en la BD
        for (const label of response.Labels) {
            const tagName = label.Name;
            // Insertar etiqueta si no existe
            const tagInsert = 'INSERT INTO etiquetas (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING';
            await db.query(tagInsert, [tagName]);
            
            // Obtener el ID de la etiqueta
            const tagIdRes = await db.query('SELECT id FROM etiquetas WHERE nombre = $1', [tagName]);
            if (tagIdRes.rows.length > 0) {
                // Relacionar etiqueta con publicación
                await db.query('INSERT INTO publicacion_etiquetas (id_publicacion, id_etiqueta) VALUES ($1, $2)', [id_publicacion, tagIdRes.rows[0].id]);
            }
        }

        res.status(201).json({ message: 'Publicación creada y analizada con éxito' });
    } catch (error) {
        console.error("Error al crear publicación/analizar:", error);
        res.status(500).json({ error: 'Error en el servidor al publicar' });
    }
};

const translateDescription = async (req, res) => {
    const { texto } = req.body;
    try {
        const idiomasDestino = ['en', 'fr', 'pt'];
        const traducciones = {};

        for (const lang of idiomasDestino) {
            try {
                const command = new TranslateTextCommand({
                    SourceLanguageCode: "auto",
                    TargetLanguageCode: lang,
                    Text: texto
                });
                const response = await translate.send(command);
                traducciones[lang] = response.TranslatedText;
            } catch (awsError) {
                // Si AWS tira el error de suscripción, devolvemos un texto simulado para que la app no falle
                if (awsError.name === 'SubscriptionRequiredException' || awsError.$metadata?.httpStatusCode === 400) {
                    traducciones[lang] = `[Traducción bloqueada por límite de AWS]`;
                } else {
                    throw awsError; // Si es otro error grave, lo lanzamos
                }
            }
        }

        res.status(200).json({ traducciones });
    } catch (error) {
        console.error("Error al traducir:", error);
        res.status(500).json({ error: 'Error al traducir texto' });
    }
};

const getFeed = async (req, res) => {
    try {
        const userId = req.params.id;
        // Obtiene publicaciones propias y de amigos aprobados
        const query = `
            SELECT p.*, u.nombre_completo, u.foto_perfil_url,
            COALESCE(
                (SELECT array_agg(e.nombre) 
                 FROM etiquetas e 
                 JOIN publicacion_etiquetas pe ON e.id = pe.id_etiqueta 
                 WHERE pe.id_publicacion = p.id), 
            '{}') as etiquetas
            FROM publicaciones p
            JOIN usuarios u ON p.id_usuario = u.id
            WHERE p.id_usuario = $1 OR p.id_usuario IN (
                SELECT id_usuario2 FROM amistades WHERE id_usuario1 = $1 AND estado = 'aceptada'
                UNION
                SELECT id_usuario1 FROM amistades WHERE id_usuario2 = $1 AND estado = 'aceptada'
            )
            ORDER BY p.fecha_publicacion DESC
        `;
        const { rows } = await db.query(query, [userId]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el feed' });
    }
};

const getAllTags = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT nombre FROM etiquetas ORDER BY nombre ASC');
        res.status(200).json(rows.map(r => r.nombre));
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener etiquetas' });
    }
};

module.exports = { createPublication, getFeed, translateDescription, getAllTags };