import { useState, useEffect, useRef } from 'react';
import { api, uploadImage } from '../api';
import CommentSection from '../components/CommentSection';

export default function Feed({ user, setUser }) {
    const [publicaciones, setPublicaciones] = useState([]);
    const [archivo, setArchivo] = useState(null);
    const [descripcion, setDescripcion] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [etiquetasDisponibles, setEtiquetasDisponibles] = useState([]);
    const [filtroActual, setFiltroActual] = useState('Todos');
    const [busquedaEtiqueta, setBusquedaEtiqueta] = useState('');

    // NUEVO: Referencia para el input de archivo oculto
    const fileInputRef = useRef(null);

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

    // NUEVO: Función para simular el clic
    const handleFileClick = () => {
        fileInputRef.current.click();
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
                imagen_url: lambdaRes.url || lambdaRes.imageUrl || lambdaRes,
                descripcion: descripcion,
                s3_filename: archivo.name
            });

            alert('Publicación creada!');
            setArchivo(null);
            setDescripcion('');
            setMostrarFormulario(false);
            cargarFeed(); 
            cargarEtiquetas(); 
        } catch (error) {
            alert('Error al publicar');
        } finally {
            setLoading(false);
        }
    };

    const publicacionesFiltradas = publicaciones.filter(pub => {
        if (filtroActual === 'Todos') return true;
        return pub.etiquetas && pub.etiquetas.includes(filtroActual); 
    });

    const etiquetasFiltradas = etiquetasDisponibles.filter(etiqueta => 
        etiqueta.toLowerCase().includes(busquedaEtiqueta.toLowerCase())
    );

    return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            
            <button 
                onClick={() => setMostrarFormulario(!mostrarFormulario)}
                style={{ 
                    width: '100%', 
                    marginBottom: '1rem', 
                    borderStyle: 'dashed',
                    backgroundColor: mostrarFormulario ? 'var(--pip-surface-light)' : 'transparent'
                }}
            >
                {mostrarFormulario ? '[-] CANCELAR PUBLICACIÓN' : '[+] NUEVA PUBLICACIÓN'}
            </button>

            {mostrarFormulario && (
                <form className="panel" onSubmit={handlePublicar} style={{ marginBottom: '2rem', padding: '1rem', animation: 'fadeIn 0.3s ease' }}>
                    <h3 style={{ color: 'var(--neon-blue)', marginTop: 0 }}>Subir a la Red</h3>
                    
{/* NUEVO: Zona de Carga de Archivo con Previsualización */}
                    <div style={{ border: '1px dashed var(--border-color)', padding: '1rem', textAlign: 'center', marginBottom: '1rem', background: 'rgba(0, 255, 65, 0.02)' }}>
                        
                        {!archivo ? (
                            <>
                                <button type="button" onClick={handleFileClick} style={{ width: '100%', marginBottom: '0.5rem' }}>
                                    SELECCIONAR IMAGEN
                                </button>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    ESPERANDO SEÑAL VISUAL...
                                </div>
                            </>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', animation: 'fadeIn 0.4s ease' }}>
                                {/* Previsualización de la Imagen */}
                                <img 
                                    src={archivo.base64} 
                                    alt="Preview" 
                                    style={{ 
                                        maxWidth: '100%', 
                                        maxHeight: '250px', 
                                        border: '2px solid var(--pip-green)',
                                        boxShadow: '0 0 10px var(--pip-green-glow)',
                                        objectFit: 'contain'
                                    }} 
                                />
                                <div style={{ color: 'var(--pip-amber)', fontSize: '0.85rem', wordBreak: 'break-all' }}>
                                    [ MEMORIA CARGADA: {archivo.name} ]
                                </div>
                                {/* Botones de Acción */}
                                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                    <button type="button" onClick={handleFileClick} style={{ flex: 1, fontSize: '0.8rem' }}>
                                        CAMBIAR
                                    </button>
                                    <button type="button" onClick={() => setArchivo(null)} style={{ flex: 1, fontSize: '0.8rem', borderColor: 'var(--pip-red)', color: 'var(--pip-red)' }}>
                                        DESCARTAR
                                    </button>
                                </div>
                            </div>
                        )}

                        <input 
                            type="file" 
                            accept="image/*" 
                            ref={fileInputRef}
                            onChange={handleFileChange} 
                            style={{ display: 'none' }} 
                        />
                    </div>

                    <textarea 
                        placeholder="Ingresa los datos..." 
                        value={descripcion} 
                        onChange={(e) => setDescripcion(e.target.value)}
                        style={{ width: '100%', marginBottom: '1rem', height: '80px' }}
                    />
                    <button type="submit" disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Procesando IA y Subiendo...' : 'Transmitir'}
                    </button>
                </form>
            )}

            {/* SECCIÓN DE FILTROS */}
            <div className="panel" style={{ padding: '1rem', marginBottom: '2rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: 'var(--pip-green-dim)' }}>FILTROS DE REKOGNITION</h4>
                
                <input 
                    type="text" 
                    placeholder="Buscar etiqueta..." 
                    value={busquedaEtiqueta}
                    onChange={(e) => setBusquedaEtiqueta(e.target.value)}
                    style={{ width: '100%', marginBottom: '1rem' }}
                />

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button 
                        onClick={() => setFiltroActual('Todos')}
                        style={{ 
                            backgroundColor: filtroActual === 'Todos' ? 'var(--neon-blue)' : 'transparent', 
                            color: filtroActual === 'Todos' ? 'var(--bg-base)' : 'var(--neon-blue)',
                            padding: '4px 10px', fontSize: '0.8rem'
                        }}
                    >
                        Todos
                    </button>
                    
                    {etiquetasFiltradas.map(etiqueta => (
                        <button 
                            key={etiqueta}
                            onClick={() => setFiltroActual(etiqueta)}
                            style={{ 
                                backgroundColor: filtroActual === etiqueta ? 'var(--neon-blue)' : 'transparent', 
                                color: filtroActual === etiqueta ? 'var(--bg-base)' : 'var(--neon-blue)',
                                padding: '4px 10px', fontSize: '0.8rem'
                            }}
                        >
                            {etiqueta}
                        </button>
                    ))}
                </div>
            </div>

            {/* FEED DE PUBLICACIONES */}
            <div>
                {publicacionesFiltradas.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay transmisiones para mostrar.</p>
                ) : (
                    publicacionesFiltradas.map(pub => (
                        <div className="panel" key={pub.id} style={{ padding: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                <p style={{ margin: 0 }}>
                                    <strong style={{ color: 'var(--neon-blue)', fontSize: '1.1rem' }}>{pub.nombre_completo}</strong>
                                </p>
                                <small style={{ color: 'var(--text-muted)' }}>{new Date(pub.fecha_publicacion).toLocaleString()}</small>
                            </div>
                            
                            <p style={{ margin: '1rem 0', fontSize: '1.05rem' }}>{pub.descripcion}</p>
                            
                            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                                <img src={pub.imagen_url} alt="Pub" style={{ maxWidth: '100%', border: '2px solid var(--border-color)' }} />
                            </div>

                            {pub.etiquetas && pub.etiquetas.length > 0 && (
                                <div style={{ marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--pip-amber)' }}>
                                    [TAGS_IA]: {pub.etiquetas.join(' | ')}
                                </div>
                            )}
                            
                            <button onClick={() => handleTraducir(pub.descripcion, pub.id)} style={{ marginBottom: '1rem', fontSize: '0.8rem', padding: '4px 10px' }}>
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