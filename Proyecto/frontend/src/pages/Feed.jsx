// frontend/src/pages/Feed.jsx
import { useState, useEffect } from 'react';
import { api, uploadImage } from '../api';
import CommentSection from '../components/CommentSection';

export default function Feed({ user, setUser }) {
    const [publicaciones, setPublicaciones] = useState([]);
    const [archivo, setArchivo] = useState(null);
    const [descripcion, setDescripcion] = useState('');
    const [loading, setLoading] = useState(false);

    // Nuevos estados para los filtros de Rekognition
    const [etiquetasDisponibles, setEtiquetasDisponibles] = useState([]);
    const [filtroActual, setFiltroActual] = useState('Todos');
    const [busquedaEtiqueta, setBusquedaEtiqueta] = useState('');

    useEffect(() => {
        cargarFeed();
        cargarEtiquetas();
    }, []);

    const cargarFeed = async () => {
        try {
            const { data } = await api.get(`/feed/${user.id}`);
            setPublicaciones(data);
        } catch (error) {
            console.error('Error cargando feed');
        }
    };

    const cargarEtiquetas = async () => {
        try {
            const { data } = await api.get('/tags');
            setEtiquetasDisponibles(data);
        } catch (error) {
            console.error('Error cargando etiquetas');
        }
    };

    const handleTraducir = async (texto, idPublicacion) => {
        try {
            const { data } = await api.post('/translate', { texto });
            alert(`EN: ${data.traducciones.en}\nFR: ${data.traducciones.fr}\nPT: ${data.traducciones.pt}`);
        } catch (error) {
            alert('Error al traducir');
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setArchivo({ base64: reader.result, name: file.name });
            reader.readAsDataURL(file);
        }
    };

    const handlePublicar = async (e) => {
        e.preventDefault();
        if (!archivo) return alert("La imagen es obligatoria");
        setLoading(true);

        try {
            const lambdaRes = await uploadImage(archivo.base64, archivo.name, 'Fotos_Publicadas');
            
            await api.post('/publications', {
                id_usuario: user.id,
                imagen_url: lambdaRes.url,
                descripcion: descripcion,
                s3_filename: archivo.name
            });

            alert('Publicación creada!');
            setArchivo(null);
            setDescripcion('');
            cargarFeed(); 
            cargarEtiquetas(); // Recargar etiquetas por si Amazon Rekognition detectó una nueva
        } catch (error) {
            alert('Error al publicar');
        } finally {
            setLoading(false);
        }
    };

    const cerrarSesion = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    // Lógica para filtrar las publicaciones en base a la etiqueta seleccionada
    const publicacionesFiltradas = publicaciones.filter(pub => {
        if (filtroActual === 'Todos') return true;
        // pub.etiquetas viene del Backend gracias a la consulta SQL que actualizamos
        return pub.etiquetas && pub.etiquetas.includes(filtroActual); 
    });

    // Lógica para filtrar los botones de etiquetas usando la barra de búsqueda
    const etiquetasFiltradas = etiquetasDisponibles.filter(etiqueta => 
        etiqueta.toLowerCase().includes(busquedaEtiqueta.toLowerCase())
    );

    return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Hola, {user.nombre_completo}</h2>
                <button onClick={cerrarSesion}>Salir</button>
            </div>

            {/* Formulario de Nueva Publicación */}
            <form className="panel" onSubmit={handlePublicar} style={{ marginBottom: '2rem', padding: '1rem' }}>
                <h3 style={{ color: 'var(--neon-blue)', marginTop: 0 }}>Nueva Publicación</h3>
                <input type="file" accept="image/*" onChange={handleFileChange} required style={{ marginBottom: '1rem', width: '95%' }} />
                <textarea 
                    placeholder="¿Qué estás pensando?" 
                    value={descripcion} 
                    onChange={(e) => setDescripcion(e.target.value)}
                    style={{ width: '95%', marginBottom: '1rem', height: '80px' }}
                />
                <button type="submit" disabled={loading} style={{ width: '100%' }}>
                    {loading ? 'Analizando imagen y Publicando...' : 'Publicar'}
                </button>
            </form>

            {/* SECCIÓN DE FILTROS (Requisito del PDF) */}
            <div className="panel" style={{ padding: '1rem', marginBottom: '2rem' }}>
                <h4 style={{ margin: '0 0 1rem 0' }}>Filtros de Rekognition</h4>
                
                {/* Buscador de etiquetas */}
                <input 
                    type="text" 
                    placeholder="Buscar etiqueta..." 
                    value={busquedaEtiqueta}
                    onChange={(e) => setBusquedaEtiqueta(e.target.value)}
                    style={{ width: '95%', marginBottom: '1rem' }}
                />

                {/* Lista de Etiquetas (Botones) */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button 
                        onClick={() => setFiltroActual('Todos')}
                        style={{ backgroundColor: filtroActual === 'Todos' ? 'var(--neon-blue)' : 'transparent', color: filtroActual === 'Todos' ? 'var(--bg-base)' : 'var(--neon-blue)' }}
                    >
                        Todos
                    </button>
                    
                    {etiquetasFiltradas.map(etiqueta => (
                        <button 
                            key={etiqueta}
                            onClick={() => setFiltroActual(etiqueta)}
                            style={{ backgroundColor: filtroActual === etiqueta ? 'var(--neon-blue)' : 'transparent', color: filtroActual === etiqueta ? 'var(--bg-base)' : 'var(--neon-blue)' }}
                        >
                            {etiqueta}
                        </button>
                    ))}
                </div>
            </div>

            {/* FEED DE PUBLICACIONES */}
            <div>
                {publicacionesFiltradas.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay publicaciones para mostrar.</p>
                ) : (
                    publicacionesFiltradas.map(pub => (
                        <div className="panel" key={pub.id} style={{ padding: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p style={{ margin: 0 }}>
                                    <strong style={{ color: 'var(--neon-blue)' }}>{pub.nombre_completo}</strong>
                                </p>
                                <small style={{ color: 'var(--text-muted)' }}>{new Date(pub.fecha_publicacion).toLocaleString()}</small>
                            </div>
                            
                            <p style={{ margin: '1rem 0' }}>{pub.descripcion}</p>
                            
                            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                                <img src={pub.imagen_url} alt="Pub" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                            </div>

                            {/* Mostrar las etiquetas que Rekognition detectó en esta imagen */}
                            {pub.etiquetas && pub.etiquetas.length > 0 && (
                                <div style={{ marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    Tags: {pub.etiquetas.join(', ')}
                                </div>
                            )}
                            
                            <button onClick={() => handleTraducir(pub.descripcion, pub.id)} style={{ marginBottom: '1rem' }}>
                                Traducir Descripción
                            </button>
                            
                            <CommentSection pubId={pub.id} user={user} />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}