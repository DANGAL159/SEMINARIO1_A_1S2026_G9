// frontend/src/pages/Login.jsx
import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Login({ setUser }) {
    const [modo, setModo] = useState('password'); // 'password' o 'face'
    const [correo, setCorreo] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Referencias para la cámara
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const iniciarCamara = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (error) {
            alert('No se pudo acceder a la cámara.');
        }
    };

    const detenerCamara = () => {
        const stream = videoRef.current?.srcObject;
        const tracks = stream?.getTracks() || [];
        tracks.forEach(track => track.stop());
    };

    const handleLoginPassword = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/auth/login', { correo, contrasena });
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
        } catch (error) {
            alert('Error: ' + (error.response?.data?.error || 'Desconocido'));
        }
    };

const handleLoginFacial = async () => {
        if (!correo) return alert('Ingresa tu correo primero para buscar tu perfil.');
        setLoading(true);

        // Capturar foto del video
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        // 1. Cambiamos el nombre de la variable aquí a snake_case
        const imagen_base64 = canvas.toDataURL('image/jpeg');

        try {
            // 2. Enviamos la variable con el nombre exacto que espera el backend
            const { data } = await api.post('/auth/login-facial', { correo, imagen_base64 });
            detenerCamara();
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
        } catch (error) {
            alert('Fallo biométrico: ' + (error.response?.data?.error || 'Rostro no coincide'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="panel" style={{ padding: '2rem', maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--neon-blue)', marginBottom: '2rem' }}>SYS.LOGIN // SEMI-SOCIAL</h2>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', justifyContent: 'center' }}>
                <button onClick={() => { setModo('password'); detenerCamara(); }} style={{ opacity: modo === 'password' ? 1 : 0.5 }}>Password</button>
                <button onClick={() => { setModo('face'); iniciarCamara(); }} style={{ opacity: modo === 'face' ? 1 : 0.5 }}>Face ID</button>
            </div>

            {modo === 'password' ? (
                <form onSubmit={handleLoginPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input type="email" placeholder="Correo" required value={correo} onChange={(e) => setCorreo(e.target.value)} />
                    <input type="password" placeholder="Contraseña" required value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
                    <button type="submit">Ingresar al Sistema</button>
                </form>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                    <input type="email" placeholder="Ingresa tu correo" required value={correo} onChange={(e) => setCorreo(e.target.value)} style={{ width: '100%' }} />
                    
                    {/* Pantalla de cámara estilo sci-fi */}
                    <div style={{ border: '2px solid var(--neon-blue)', padding: '5px', borderRadius: '8px', position: 'relative' }}>
                        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '4px', transform: 'scaleX(-1)' }} />
                        <div style={{ position: 'absolute', top: '10px', right: '10px', color: 'red', fontSize: '12px', animation: 'blink 1s infinite' }}>REC</div>
                    </div>
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    <button onClick={handleLoginFacial} disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Escaneando...' : 'Iniciar Escaneo Biométrico'}
                    </button>
                </div>
            )}
            
            <p style={{ marginTop: '2rem', fontSize: '0.9rem' }}>
                ¿No tienes credenciales? <Link to="/register">Regístrate aquí</Link>
            </p>
        </div>
    );
}