// frontend/src/pages/Chat.jsx
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { api, SERVER_ROOT } from '../api';

// Le decimos explícitamente que intente usar WebSockets directos primero
const socket = io(SERVER_ROOT, {
    transports: ['websocket', 'polling']
});

export default function Chat({ user }) {
    const [amigos, setAmigos] = useState([]);
    const [amigoActivo, setAmigoActivo] = useState(null);
    const [mensaje, setMensaje] = useState('');
    const [chatLog, setChatLog] = useState([]);
    
    // Estado y ref para el indicador de escritura
    const [estaEscribiendo, setEstaEscribiendo] = useState(false);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        cargarAmigos();

        // 1. LISTENER DE RECONEXIÓN (LA CURA PARA LA AMNESIA)
        const handleConnect = () => {
            console.log("WebSocket (re)conectado al servidor.");
            if (amigoActivo) {
                const room = `sala_${[user.id, amigoActivo.id].sort().join('_')}`;
                socket.emit('join_chat', room);
            }
        };
        socket.on('connect', handleConnect);

        // 2. Listener para mensajes normales
        socket.on('receive_message', (data) => {
            setChatLog((prev) => [...prev, data]);
        });

        // 3. Listener para el indicador de escritura
        socket.on('user_typing', (data) => {
            console.log(`[RECEPTOR] Recibido evento typing de:`, data.username, `Estado:`, data.isTyping);

            if (amigoActivo) {
                const room = `sala_${[user.id, amigoActivo.id].sort().join('_')}`;
                if (data.room === room && data.username !== user.nombre_completo) {
                    setEstaEscribiendo(data.isTyping);
                }
            }
        });

        return () => {
            socket.off('connect', handleConnect);
            socket.off('receive_message');
            socket.off('user_typing');
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [amigoActivo, user]); // VITAL: amigoActivo debe estar en el arreglo de dependencias

    const cargarAmigos = async () => {
        try {
            const { data } = await api.get(`/friends/${user.id}`);
            setAmigos(data);
        } catch (error) {
            console.error('Error cargando amigos');
        }
    };

    const seleccionarAmigo = async (amigo) => {
        // Limpiar indicador anterior al cambiar de amigo
        setEstaEscribiendo(false);
        setAmigoActivo(amigo);
        const room = `sala_${[user.id, amigo.id].sort().join('_')}`;

        try {
            const { data } = await api.get(`/chat/${room}`);
            setChatLog(data);
        } catch (error) {
            console.error("No se pudo cargar el historial del chat", error);
            setChatLog([]);
        }

        socket.emit('join_chat', room);
    };

    const manejarEscritura = () => {
        if (!amigoActivo) return;
        const room = `sala_${[user.id, amigoActivo.id].sort().join('_')}`;

        console.log(`[EMISOR] Enviando 'typing' a ${room}...`);
        
        // Avisar que estamos escribiendo
        socket.emit('typing', { 
            room, 
            username: user.nombre_completo,
            isTyping: true 
        });

        // Limpiar el temporizador anterior
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Si pasan 2 segundos sin presionar tecla, avisar que nos detuvimos
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing', { 
                room, 
                username: user.nombre_completo,
                isTyping: false 
            });
        }, 2000);
    };

    const enviarMensaje = (e) => {
        e.preventDefault();
        if (mensaje.trim() === '' || !amigoActivo) return;

        const room = `sala_${[user.id, amigoActivo.id].sort().join('_')}`;

        const data = {
            room: room,
            message: mensaje,
            senderId: user.id,
            senderName: user.nombre_completo,
            sender: user.nombre_completo
        };

        socket.emit('send_message', data);
        setMensaje('');
        
        // Notificar que dejamos de escribir al enviar
        socket.emit('typing', { 
            room, 
            username: user.nombre_completo,
            isTyping: false 
        });
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    };

    return (
        <div className="panel" style={{ display: 'flex', height: '500px', maxWidth: '800px', margin: '2rem auto' }}>

            {/* Lista de Amigos (Izquierda) */}
            <div style={{ width: '30%', borderRight: '1px solid var(--border-color)', overflowY: 'auto' }}>
                <h3 style={{ padding: '1rem', margin: 0, borderBottom: '1px solid var(--border-color)' }}>Contactos</h3>
                {amigos.length === 0 ? (
                    <p style={{ padding: '1rem', color: 'var(--text-muted)' }}>No tienes amigos aún.</p>
                ) : (
                    amigos.map(a => (
                        <div
                            key={a.id}
                            onClick={() => seleccionarAmigo(a)}
                            style={{
                                padding: '1rem',
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--border-color)',
                                background: amigoActivo?.id === a.id ? 'var(--border-color)' : 'transparent'
                            }}
                        >
                            {a.nombre_completo}
                        </div>
                    ))
                )}
            </div>

            {/* Ventana de Chat (Derecha) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {amigoActivo ? (
                    <>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-base)' }}>
                            <strong style={{ color: 'var(--neon-blue)' }}>Chat con {amigoActivo.nombre_completo}</strong>
                            {/* Indicador de escritura */}
                            {estaEscribiendo && (
                                <span style={{ 
                                    fontSize: '0.8rem', 
                                    color: 'var(--neon-blue)', 
                                    marginLeft: '0.5rem',
                                    fontStyle: 'italic'
                                }}>
                                    Escribiendo...
                                </span>
                            )}
                        </div>

                        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {chatLog.map((msg, idx) => (
                                <div key={idx} style={{ textAlign: msg.sender === user.nombre_completo ? 'right' : 'left' }}>
                                    <span style={{
                                        display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '15px',
                                        background: msg.sender === user.nombre_completo ? 'var(--neon-blue)' : 'var(--border-color)',
                                        color: msg.sender === user.nombre_completo ? 'var(--bg-base)' : 'var(--text-main)'
                                    }}>
                                        {msg.message}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={enviarMensaje} style={{ display: 'flex', padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
                            <input
                                style={{ flex: 1, marginRight: '1rem' }}
                                type="text"
                                value={mensaje}
                                onChange={(e) => { 
                                    setMensaje(e.target.value); 
                                    manejarEscritura(); 
                                }}
                                placeholder="Cifra tu mensaje..."
                            />
                            <button type="submit">Enviar</button>
                        </form>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        Selecciona un contacto para iniciar un canal seguro.
                    </div>
                )}
            </div>
        </div>
    );
}