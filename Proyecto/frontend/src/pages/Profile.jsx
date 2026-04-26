// frontend/src/pages/Profile.jsx
import { useState, useRef } from 'react';
import { api, uploadImage } from '../api';

export default function Profile({ user, setUser }) {
    const [formData, setFormData] = useState({
        nombre_completo: user.nombre_completo,
        dpi: user.dpi,
        contrasena_actual: ''
    });
    
    const [archivo, setArchivo] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(user.foto_perfil_url);
    const [usandoCamara, setUsandoCamara] = useState(false);
    
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null); // Referencia para ocultar el input feo

    const iniciarCamara = async () => {
        setUsandoCamara(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (error) {
            alert('Error accediendo a la cámara.');
            setUsandoCamara(false);
        }
    };

    const detenerCamara = () => {
        const stream = videoRef.current?.srcObject;
        const tracks = stream?.getTracks() || [];
        tracks.forEach(track => track.stop());
        setUsandoCamara(false);
    };

    const capturarFoto = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        const base64 = canvas.toDataURL('image/jpeg');
        setArchivo({ base64, name: `camara-${Date.now()}.jpg` });
        setPreviewUrl(base64);
        detenerCamara();
    };

    const handleFileClick = () => {
        fileInputRef.current.click(); // Simula el clic en el input oculto
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setArchivo({ base64: reader.result, name: file.name });
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            let fotoUrl = user.foto_perfil_url;
            if (archivo) {
                const lambdaRes = await uploadImage(archivo.base64, archivo.name, 'fotosPerfil');
                fotoUrl = lambdaRes.url || lambdaRes.imageUrl || lambdaRes;
            }

            const { data } = await api.put(`/users/${user.id}`, {
                ...formData,
                foto_perfil_url: fotoUrl
            });
            
            const updatedUser = { ...user, ...data.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            alert('Perfil actualizado con éxito');
        } catch (error) {
            alert('Error: ' + (error.response?.data?.error || 'Contraseña incorrecta'));
        }
    };

    return (
        <div className="panel" style={{ padding: '2rem', maxWidth: '450px', margin: '2rem auto' }}>
            <h2 style={{ color: 'var(--neon-blue)', textAlign: 'center', marginBottom: '1.5rem' }}>{user.nombre_completo.toUpperCase()}</h2>
            
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <img 
                    src={previewUrl} 
                    alt="Perfil" 
                    style={{ 
                        width: '150px', height: '150px', borderRadius: '50%', 
                        objectFit: 'cover', border: '3px solid var(--neon-blue)', marginBottom: '1rem'
                    }} 
                />
            </div>

            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input 
                    type="text" value={formData.nombre_completo} required placeholder="Nombre Completo"
                    onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})} 
                />
                
                
                
                <div style={{ border: '1px dashed var(--border-color)', padding: '1rem', textAlign: 'center' }}>
                    <label style={{ display: 'block', marginBottom: '1rem', color: 'var(--pip-green-dim)' }}>ACTUALIZAR FOTOGRAFÍA</label>
                    
                    {!usandoCamara ? (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button type="button" onClick={handleFileClick} style={{ flex: 1 }}>SUBIR ARCHIVO</button>
                            <button type="button" onClick={iniciarCamara} style={{ flex: 1 }}>USAR CÁMARA</button>
                        </div>
                    ) : (
                        <div>
                            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '4px', transform: 'scaleX(-1)' }} />
                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={capturarFoto} style={{ flex: 1, backgroundColor: 'var(--pip-green)', color: '#000' }}>CAPTURAR</button>
                                <button type="button" onClick={detenerCamara} style={{ flex: 1, borderColor: 'var(--pip-red)', color: 'var(--pip-red)' }}>CANCELAR</button>
                            </div>
                        </div>
                    )}
                    
                    {/* El input feo oculto */}
                    <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        style={{ display: 'none' }} 
                    />
                </div>
                
                <hr style={{ borderColor: 'var(--border-color)', margin: '1rem 0' }} />

                <input 
                    type="password" placeholder="Contraseña Actual (Obligatoria para guardar)" required
                    onChange={(e) => setFormData({...formData, contrasena_actual: e.target.value})} 
                />
                <button type="submit" style={{ fontSize: '1.1rem', padding: '15px' }}>GUARDAR CAMBIOS</button>
            </form>
        </div>
    );
}