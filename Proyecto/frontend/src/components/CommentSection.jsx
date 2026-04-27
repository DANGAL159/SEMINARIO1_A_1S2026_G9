import { useState, useEffect } from 'react';
import { api } from '../api';

export default function CommentSection({ pubId, user }) {
    const [comentarios, setComentarios] = useState([]);
    const [nuevoComentario, setNuevoComentario] = useState('');

    useEffect(() => {
        cargarComentarios();
    }, [pubId]);

    const cargarComentarios = async () => {
        try {
            const { data } = await api.get(`/publications/${pubId}/comments`);
            setComentarios(data);
        } catch (error) {
            console.error("Error cargando comentarios");
        }
    };

    const handleComentar = async (e) => {
        e.preventDefault();
        if (!nuevoComentario.trim()) return;
        
        try {
            await api.post('/publications/comments', {
                id_publicacion: pubId,
                id_usuario: user.id,
                texto: nuevoComentario
            });
            setNuevoComentario(''); // Limpiar el input
            cargarComentarios(); // Recargar la lista
        } catch (error) {
            alert("Error al enviar el comentario");
        }
    };

    // NUEVO: Función segura de traducción
    const handleTraducirComentario = async (textoComentario) => {
        try {
            const { data } = await api.post('/translate', { texto: textoComentario });
            alert(`EN: ${data.traducciones.en}\nFR: ${data.traducciones.fr}\nPT: ${data.traducciones.pt}`);
        } catch (error) {
            alert("Error al traducir el comentario");
        }
    };

    return (
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-base)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--neon-blue)' }}>Comentarios</h4>
            
            <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '1rem', fontSize: '0.9rem' }}>
                {comentarios.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>Sé el primero en comentar.</p>
                ) : (
                    comentarios.map(c => (
                        <div key={c.id} style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                            <strong style={{ color: 'var(--text-main)' }}>{c.nombre_completo}: </strong> 
                            <span style={{ color: 'var(--text-muted)', display: 'block', margin: '0.2rem 0' }}>{c.texto}</span>
                            
                            {/* NUEVO: Botón de traducción debajo del texto */}
                            <button 
                                onClick={() => handleTraducirComentario(c.texto)} 
                                style={{ 
                                    background: 'transparent', 
                                    border: 'none', 
                                    color: 'var(--pip-amber)', 
                                    fontSize: '0.7rem', 
                                    cursor: 'pointer',
                                    padding: '0',
                                    textDecoration: 'underline'
                                }}
                            >
                                [Traducir Comentario]
                            </button>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleComentar} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text"
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    placeholder="Escribe un comentario..."
                    style={{ flex: 1, padding: '0.5rem' }}
                />
                <button type="submit" style={{ padding: '0.5rem 1rem' }}>Enviar</button>
            </form>
        </div>
    );
}