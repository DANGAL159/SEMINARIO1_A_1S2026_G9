import { useState, useRef, useEffect } from 'react';
import { api } from '../api';

export default function LexBot() {
    const [abierto, setAbierto] = useState(false);
    const [mensajes, setMensajes] = useState([{ sender: 'bot', text: 'SISTEMA ASISTENTE LEX. ¿En qué puedo ayudarte sobre la Facultad de Ingeniería?' }]);
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
            // Lógica intacta: enviamos "text" y "sessionId", esperamos "data.reply"
            const { data } = await api.post('/bot/chat', { text: textoUsuario, sessionId: 'user-123' });
            setMensajes(prev => [...prev, { sender: 'bot', text: data.reply }]);
        } catch (error) {
            setMensajes(prev => [...prev, { sender: 'bot', text: 'Error de conexión con AWS Lex.' }]);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
            {abierto && (
                <div style={{ 
                    width: '350px', 
                    height: '450px', 
                    backgroundColor: 'var(--pip-bg)', 
                    border: '2px solid var(--pip-green)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    marginBottom: '15px',
                    boxShadow: '0 0 20px rgba(0, 255, 65, 0.15)'
                }}>
                    
                    {/* CABECERA TERMINAL */}
                    <div style={{ 
                        padding: '10px', 
                        background: 'var(--pip-surface-light)', 
                        borderBottom: '1px solid var(--pip-green-dark)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <strong style={{ color: 'var(--pip-green)', fontFamily: '"VT323", monospace', fontSize: '1.2rem', letterSpacing: '2px' }}>
                            // LEX_TERMINAL
                        </strong>
                        <button 
                            onClick={() => setAbierto(false)} 
                            style={{ 
                                background: 'transparent', 
                                border: '1px solid var(--pip-green-dark)', 
                                color: 'var(--pip-green)', 
                                padding: '2px 8px',
                                cursor: 'pointer'
                            }}
                        >
                            X
                        </button>
                    </div>
                    
                    {/* CUERPO DE MENSAJES */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {mensajes.map((msg, idx) => (
                            <div key={idx} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                <div style={{ 
                                    fontSize: '0.7rem', 
                                    color: 'var(--pip-green-dark)', 
                                    marginBottom: '2px',
                                    textAlign: msg.sender === 'user' ? 'right' : 'left'
                                }}>
                                    {msg.sender === 'user' ? 'USER_123' : 'SYS_LEX'}
                                </div>
                                <div style={{ 
                                    backgroundColor: msg.sender === 'user' ? 'var(--pip-surface-light)' : 'transparent', 
                                    border: msg.sender === 'user' ? '1px solid var(--pip-green-dark)' : 'none',
                                    borderLeft: msg.sender === 'bot' ? '3px solid var(--pip-green)' : 'none',
                                    color: 'var(--pip-green)',
                                    padding: '8px 12px', 
                                    fontFamily: '"Share Tech Mono", monospace',
                                    fontSize: '0.9rem'
                                }}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={endOfMessagesRef} />
                    </div>

                    {/* INPUT COMANDOS */}
                    <form onSubmit={enviarMensaje} style={{ display: 'flex', padding: '10px', borderTop: '2px solid var(--pip-green-dark)', background: 'var(--pip-surface)' }}>
                        <span style={{ color: 'var(--pip-green)', paddingRight: '10px', fontWeight: 'bold' }}>&gt;</span>
                        <input 
                            type="text" 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            placeholder="Ingrese comando..." 
                            style={{ 
                                flex: 1, 
                                background: 'transparent', 
                                border: 'none', 
                                color: 'var(--pip-green)',
                                outline: 'none',
                                fontFamily: '"Share Tech Mono", monospace'
                            }} 
                        />
                    </form>
                </div>
            )}

            {/* BOTÓN FLOTANTE PIP-BOY */}
            {!abierto && (
                <button 
                    onClick={() => setAbierto(true)} 
                    style={{ 
                        borderRadius: '50%', 
                        width: '65px', 
                        height: '65px', 
                        backgroundColor: 'var(--pip-surface)', 
                        color: 'var(--pip-green)', 
                        border: '2px solid var(--pip-green)', 
                        cursor: 'pointer', 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 15px var(--pip-green-glow)'
                    }}
                >
                    <span style={{ fontFamily: '"VT323", monospace', fontSize: '1.8rem', fontWeight: 'bold' }}>&gt;_</span>
                </button>
            )}
        </div>
    );
}