// frontend/src/components/LexBot.jsx
import { useState, useRef, useEffect } from 'react';
import { api } from '../api';

export default function LexBot() {
    const [abierto, setAbierto] = useState(false);
    const [mensajes, setMensajes] = useState([{ sender: 'bot', text: '¡Hola! ¿En qué puedo ayudarte sobre la Facultad de Ingeniería?' }]);
    const [input, setInput] = useState('');
    const endOfMessagesRef = useRef(null);

    // Auto-scroll al último mensaje
    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensajes]);

    const enviarMensaje = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const textoUsuario = input;
        setMensajes(prev => [...prev, { sender: 'user', text: textoUsuario }]);
        setInput('');

        try {
            const { data } = await api.post('/bot/chat', { text: textoUsuario, sessionId: 'user-123' });
            setMensajes(prev => [...prev, { sender: 'bot', text: data.reply }]);
        } catch (error) {
            setMensajes(prev => [...prev, { sender: 'bot', text: 'Error de conexión con AWS Lex.' }]);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
            {abierto && (
                <div className="panel" style={{ width: '320px', height: '450px', display: 'flex', flexDirection: 'column', marginBottom: '10px' }}>
                    <div style={{ padding: '1rem', background: 'var(--border-color)', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
                        <strong style={{ color: 'var(--neon-blue)' }}>Ingeniería Bot (Lex)</strong>
                    </div>
                    
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {mensajes.map((msg, idx) => (
                            <div key={idx} style={{ textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                                <span style={{ 
                                    background: msg.sender === 'user' ? 'var(--neon-blue)' : 'var(--border-color)', 
                                    color: msg.sender === 'user' ? 'var(--bg-base)' : 'var(--text-main)',
                                    padding: '0.5rem 1rem', borderRadius: '15px', display: 'inline-block', maxWidth: '80%'
                                }}>
                                    {msg.text}
                                </span>
                            </div>
                        ))}
                        <div ref={endOfMessagesRef} />
                    </div>

                    <form onSubmit={enviarMensaje} style={{ display: 'flex', padding: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribe tu duda..." style={{ flex: 1 }} />
                        <button type="submit" style={{ marginLeft: '0.5rem' }}>&gt;</button>
                    </form>
                </div>
            )}
            <button onClick={() => setAbierto(!abierto)} style={{ borderRadius: '50%', width: '60px', height: '60px', background: 'var(--neon-blue)', color: 'var(--bg-base)', border: 'none', cursor: 'pointer', fontSize: '24px', boxShadow: '0 0 15px var(--neon-glow)' }}>
                🤖
            </button>
        </div>
    );
}