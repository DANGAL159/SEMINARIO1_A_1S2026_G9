import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { api, SERVER_ROOT } from '../api';

const socket = io(SERVER_ROOT, {
    transports: ['websocket', 'polling']
});

export default function Chat({ user }) {
    const [amigos, setAmigos] = useState([]);
    const [amigoActivo, setAmigoActivo] = useState(null);
    const [mensaje, setMensaje] = useState('');
    const [chatLog, setChatLog] = useState([]);
    const [estaEscribiendo, setEstaEscribiendo] = useState(false);
    
    const typingTimeoutRef = useRef(null);
    // NUEVO: Referencia para el ancla del auto-scroll
    const messagesEndRef = useRef(null);

    // NUEVO: Efecto que hace scroll hacia abajo cada vez que cambia el chatLog
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatLog]);

    useEffect(() => {
        cargarAmigos();

        const handleConnect = () => {
            if (amigoActivo) {
                const room = `sala_${[user.id, amigoActivo.id].sort().join('_')}`;
                socket.emit('join_chat', room);
            }
        };
        socket.on('connect', handleConnect);

        socket.on('receive_message', (data) => {
            setChatLog((prev) => [...prev, data]);
        });

        socket.on('user_typing', (data) => {
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
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [amigoActivo, user]);

    const cargarAmigos = async () => {
        try {
            const { data } = await api.get(`/friends/${user.id}`);
            setAmigos(data);
        } catch (error) {
            console.error('Error cargando amigos');
        }
    };

    const seleccionarAmigo = async (amigo) => {
        setEstaEscribiendo(false);
        setAmigoActivo(amigo);
        const room = `sala_${[user.id, amigo.id].sort().join('_')}`;

        try {
            const { data } = await api.get(`/chat/${room}`);
            setChatLog(data);
        } catch (error) {
            setChatLog([]);
        }
        socket.emit('join_chat', room);
    };

    const manejarEscritura = () => {
        if (!amigoActivo) return;
        const room = `sala_${[user.id, amigoActivo.id].sort().join('_')}`;

        socket.emit('typing', { room, username: user.nombre_completo, isTyping: true });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing', { room, username: user.nombre_completo, isTyping: false });
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
        
        socket.emit('typing', { room, username: user.nombre_completo, isTyping: false });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };

    const MiniAvatar = ({ url }) => (
        url ? (
            <img src={url} alt="avatar" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--pip-green)' }} />
        ) : (
            <div style={{ width: '35px', height: '35px', borderRadius: '50%', border: '1px dashed var(--pip-green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>U</div>
        )
    );

    return (
        <div className="panel" style={{ display: 'flex', height: '500px', maxWidth: '800px', margin: '2rem auto' }}>

            <div style={{ width: '35%', borderRight: '1px solid var(--border-color)', overflowY: 'auto' }}>
                <h3 style={{ padding: '1rem', margin: 0, borderBottom: '1px solid var(--border-color)' }}>Contactos</h3>
                {amigos.length === 0 ? (
                    <p style={{ padding: '1rem', color: 'var(--text-muted)' }}>No tienes amigos aún.</p>
                ) : (
                    amigos.map(a => (
                        <div
                            key={a.id}
                            onClick={() => seleccionarAmigo(a)}
                            style={{
                                padding: '1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)',
                                background: amigoActivo?.id === a.id ? 'var(--pip-surface-light)' : 'transparent',
                                display: 'flex', alignItems: 'center', gap: '10px'
                            }}
                        >
                            <MiniAvatar url={a.foto_perfil_url} />
                            <span>{a.nombre_completo}</span>
                        </div>
                    ))
                )}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {amigoActivo ? (
                    <>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', background: 'var(--pip-surface-light)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <MiniAvatar url={amigoActivo.foto_perfil_url} />
                            <div>
                                <strong style={{ color: 'var(--neon-blue)', fontSize: '1.1rem' }}>ENLACE SEGURO // {amigoActivo.nombre_completo}</strong>
                                {estaEscribiendo && (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--neon-blue)', fontStyle: 'italic', display: 'block', animation: 'pulse 1s infinite' }}>Transcribiendo...</span>
                                )}
                            </div>
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
                            {/* NUEVO: El ancla invisible al final de la lista de mensajes */}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={enviarMensaje} style={{ display: 'flex', padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
                            <input
                                style={{ flex: 1, marginRight: '1rem', background: 'transparent', border: '1px solid var(--pip-green-dark)', color: 'var(--pip-green)', padding: '10px' }}
                                type="text" value={mensaje}
                                onChange={(e) => { setMensaje(e.target.value); manejarEscritura(); }}
                                placeholder="Cifra tu mensaje..."
                            />
                            <button type="submit">ENVIAR</button>
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