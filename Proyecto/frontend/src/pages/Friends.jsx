// frontend/src/pages/Friends.jsx
import { useState, useEffect } from 'react';
import { api } from '../api';

export default function Friends({ user }) {
    const [noAmigos, setNoAmigos] = useState([]);
    const [pendientes, setPendientes] = useState([]);
    // 1. NUEVO: Estado para los amigos confirmados
    const [amigos, setAmigos] = useState([]);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            // 2. NUEVO: Agregamos la llamada a /friends/:id para traer a los confirmados
            const [resSugerencias, resPendientes, resAmigos] = await Promise.all([
                api.get(`/users/${user.id}/non-friends`),
                api.get(`/friends/pending/${user.id}`),
                api.get(`/friends/${user.id}`)
            ]);
            setNoAmigos(resSugerencias.data);
            setPendientes(resPendientes.data);
            setAmigos(resAmigos.data);
        } catch (error) {
            console.error('Error cargando datos de amigos');
        }
    };

    const enviarSolicitud = async (id_amigo) => {
        try {
            await api.post('/friends/request', { id_usuario1: user.id, id_usuario2: id_amigo });
            alert('Solicitud enviada');
            cargarDatos();
        } catch (error) {
            alert('Error al enviar solicitud');
        }
    };

    const responderSolicitud = async (id_remitente, nuevoEstado) => {
        try {
            await api.put('/friends/respond', { 
                id_usuario1: id_remitente, 
                id_usuario2: user.id, 
                estado: nuevoEstado 
            });
            alert(`Solicitud ${nuevoEstado}`);
            cargarDatos();
        } catch (error) {
            alert('Error al responder solicitud');
        }
    };

    // 3. NUEVO: Función para eliminar amigo
    const eliminarAmigo = async (id_amigo, nombre_amigo) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar a ${nombre_amigo} de tus contactos?`)) return;
        
        try {
            // Mandamos los datos en el atributo 'data' porque es una petición DELETE de Axios
            await api.delete(`/friends/${user.id}`, { data: { id_usuario: user.id, id_amigo: id_amigo } });
            alert('Amistad finalizada');
            cargarDatos();
        } catch (error) {
            alert('Error al eliminar amigo');
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            
            {/* SECCIÓN 1: SOLICITUDES RECIBIDAS */}
            <div className="panel" style={{ padding: '1rem', marginBottom: '2rem' }}>
                <h3 style={{ color: 'var(--neon-blue)', marginTop: 0 }}>Solicitudes Recibidas</h3>
                {pendientes.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No tienes solicitudes pendientes.</p>
                ) : (
                    pendientes.map(u => (
                        <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
                            <span>{u.nombre_completo}</span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => responderSolicitud(u.id, 'aceptada')}>Aceptar</button>
                                <button 
                                    onClick={() => responderSolicitud(u.id, 'rechazada')}
                                    style={{ borderColor: '#ff4b2b', color: '#ff4b2b' }}
                                >
                                    Rechazar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* SECCIÓN 1.5 NUEVO: LISTA DE AMIGOS ACTUALES */}
            <div className="panel" style={{ padding: '1rem', marginBottom: '2rem' }}>
                <h3 style={{ color: 'var(--neon-blue)', marginTop: 0 }}>Mis Contactos</h3>
                {amigos.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>Aún no tienes amigos en tu red.</p>
                ) : (
                    amigos.map(u => (
                        <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
                            <span>{u.nombre_completo}</span>
                            <button 
                                onClick={() => eliminarAmigo(u.id, u.nombre_completo)}
                                style={{ borderColor: '#ff4b2b', color: '#ff4b2b', background: 'transparent' }}
                            >
                                Eliminar
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* SECCIÓN 2: SUGERENCIAS */}
            <div className="panel" style={{ padding: '1rem' }}>
                <h3 style={{ color: 'var(--neon-blue)', marginTop: 0 }}>Sugerencias de Amistad</h3>
                {noAmigos.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No hay más usuarios disponibles.</p>
                ) : (
                    noAmigos.map(u => (
                        <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
                            <span>{u.nombre_completo}</span>
                            <button onClick={() => enviarSolicitud(u.id)}>Agregar</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}