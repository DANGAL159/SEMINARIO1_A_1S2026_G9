import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, uploadImage } from '../api';

export default function Register() {
    const [formData, setFormData] = useState({
        nombre_completo: '',
        correo: '',
        dpi: '',
        contrasena: ''
    });
    const [fotoBase64, setFotoBase64] = useState(null);
    const [camaraActiva, setCamaraActiva] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- Lógica de la Cámara ---
    const iniciarCamara = async () => {
        setCamaraActiva(true);
        setFotoBase64(null); // Borrar foto anterior si reintenta
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (error) {
            alert('No se pudo acceder a la cámara. Revisa los permisos.');
            setCamaraActiva(false);
        }
    };

    const detenerCamara = () => {
        const stream = videoRef.current?.srcObject;
        const tracks = stream?.getTracks() || [];
        tracks.forEach(track => track.stop());
        setCamaraActiva(false);
    };

    const capturarFoto = (e) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        setFotoBase64(canvas.toDataURL('image/jpeg'));
        detenerCamara();
    };

    // --- Lógica de Registro ---
    const handleRegister = async (e) => {
        e.preventDefault();
        
        // Validación estricta: No hay registro sin foto
        if (!fotoBase64) {
            return alert('ACCESO DENEGADO: Debes registrar tu rostro para el escaneo biométrico.');
        }

        setLoading(true);
        try {
            // 1. Subir la foto al S3 mediante nuestra Lambda, especificando la "carpeta"
            const filename = `perfil-${formData.dpi}-${Date.now()}.jpg`;
            
            // Usamos la función uploadImage de tu api.js
            // Le pasamos el base64, el nombre, y la carpeta 'fotosPerfil'
            const s3Response = await uploadImage(fotoBase64, filename, 'fotosPerfil');
            
            // Asumimos que tu Lambda devuelve la URL directamente o dentro de un objeto
            const fotoUrl = s3Response.imageUrl || s3Response.url || s3Response;

            // 2. Armar el payload final (El backend se encarga de Cognito ahora)
            const payload = { 
                ...formData, 
                foto_perfil_url: fotoUrl 
            };
            
            // 3. Disparar al backend (EC2 -> RDS & Cognito)
            await api.post('/auth/register', payload);
            
            alert('Identidad registrada exitosamente en AWS. Proceda al Login.');
            navigate('/');
        } catch (error) {
            alert('Error en registro: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="panel" style={{ padding: '2rem', maxWidth: '400px', margin: '2rem auto', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--neon-blue)', marginBottom: '1.5rem' }}>SYS.REGISTER // NUEVO USUARIO</h2>
            
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input type="text" name="nombre_completo" placeholder="Nombre Completo" required onChange={handleChange} />
                <input type="email" name="correo" placeholder="Correo Electrónico" required onChange={handleChange} />
                <input type="text" name="dpi" placeholder="DPI (Documento de Identidad)" required onChange={handleChange} />
                <input type="password" name="contrasena" placeholder="Contraseña Segura" required minLength="8" onChange={handleChange} />

                {/* --- SECCIÓN BIOMÉTRICA --- */}
                <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                    <h4 style={{ margin: '0 0 1rem 0' }}>Registro Facial (Requerido)</h4>
                    
                    {!camaraActiva && !fotoBase64 && (
                        <button type="button" onClick={iniciarCamara} style={{ width: '100%' }}>
                            Activar Cámara
                        </button>
                    )}

                    {camaraActiva && (
                        <div style={{ position: 'relative' }}>
                            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '4px', transform: 'scaleX(-1)' }} />
                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                            <button type="button" onClick={capturarFoto} style={{ width: '100%', marginTop: '0.5rem', background: 'var(--neon-blue)', color: '#000' }}>
                                Capturar Rostro
                            </button>
                        </div>
                    )}

                    {fotoBase64 && (
                        <div>
                            <img src={fotoBase64} alt="Rostro capturado" style={{ width: '100%', borderRadius: '4px', transform: 'scaleX(-1)' }} />
                            <button type="button" onClick={iniciarCamara} style={{ width: '100%', marginTop: '0.5rem' }}>
                                Retomar Foto
                            </button>
                        </div>
                    )}
                </div>

                <button type="submit" disabled={loading} style={{ marginTop: '1rem', padding: '1rem', fontSize: '1.1rem' }}>
                    {loading ? 'Sincronizando con AWS...' : 'Registrar Identidad'}
                </button>
            </form>

            <p style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
                ¿Identidad ya registrada? <Link to="/">Inicia sesión aquí</Link>
            </p>
        </div>
    );
}