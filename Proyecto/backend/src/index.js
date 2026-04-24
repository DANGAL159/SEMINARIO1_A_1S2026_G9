// backend/src/index.js
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io'); 
require('dotenv').config();
const db = require('./config/db');

// Importar Controladores
const { updateProfile } = require('./controllers/userController');
const { registerUser, loginUser, loginFacial } = require('./controllers/authController');
const { createPublication, getFeed, translateDescription, getAllTags } = require('./controllers/publicationController');
const { addComment, getComments } = require('./controllers/commentController');
const { sendFriendRequest, respondFriendRequest, getNonFriends, getPendingRequests, getFriends, getChatHistory, deleteFriendship } = require('./controllers/friendController');
const { handleChat } = require('./controllers/botController');

const app = express();
const server = http.createServer(app);

// Configuración de CORS y JSON
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Aumentamos límite por si mandan fotos en base64 grandes

// --- CONFIGURACIÓN DE CHAT (WebSockets) ---
const io = new Server(server, {
    cors: { origin: '*' }
});

io.on('connection', (socket) => {
    console.log('Un usuario se conectó al chat');
    
    // Unirse a una sala privada
    socket.on('join_chat', (room) => {
        socket.join(room);
    });

    // Notificar si alguien escribe o se detiene
    socket.on('typing', (data) => {
        // Reenviamos el paquete EXACTO que nos manda el frontend (con room e isTyping)
        socket.to(data.room).emit('user_typing', data); 
    });

    // Recibir, GUARDAR y retransmitir mensaje
    socket.on('send_message', async (data) => {
        try {
            // 1. Guardar silenciosamente en PostgreSQL
            const query = 'INSERT INTO mensajes (sala, id_remitente, nombre_remitente, texto) VALUES ($1, $2, $3, $4)';
            await db.query(query, [data.room, data.senderId, data.senderName, data.message]);

            // 2. Retransmitir a la sala en tiempo real
            io.to(data.room).emit('receive_message', data);
        } catch (error) {
            console.error("Error guardando mensaje en BD:", error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado');
    });
});

// --- ENDPOINTS REST ---
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// Auth & Usuarios
app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);
app.post('/api/auth/login-facial', loginFacial);
app.put('/api/users/:id', updateProfile);

// Amistades
app.get('/api/users/:id/non-friends', getNonFriends);
app.post('/api/friends/request', sendFriendRequest);
app.put('/api/friends/respond', respondFriendRequest);
app.get('/api/friends/pending/:id', getPendingRequests);
app.get('/api/friends/:id', getFriends);
app.get('/api/chat/:room', getChatHistory);
app.delete('/api/friends/:id', deleteFriendship);
// Publicaciones y Comentarios
app.post('/api/publications', createPublication);
app.get('/api/feed/:id', getFeed);
app.post('/api/publications/comments', addComment);
app.get('/api/publications/:id_publicacion/comments', getComments);

// IA (Traducción, Etiquetas, Bot)
app.post('/api/translate', translateDescription);
app.get('/api/tags', getAllTags);
app.post('/api/bot/chat', handleChat);

// --- ARRANQUE DEL SERVIDOR ---
// IMPORTANTE: Se usa server.listen, no app.listen, para que WebSockets y Express compartan el puerto
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo sin errores en el puerto ${PORT}`);
});