// frontend/src/pages/Profile.jsx
import { useState } from 'react';
import { api, uploadImage } from '../api';

export default function Profile({ user, setUser }) {
    const [formData, setFormData] = useState({
        nombre_completo: user.nombre_completo,
        dpi: user.dpi,
        contrasena_actual: ''
    });
    const [archivo, setArchivo] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(user.foto_perfil_url);

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            let fotoUrl = user.foto_perfil_url;
            if (archivo) {
                // Corregido para que coincida con la carpeta de S3 que definimos en el registro
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
        <div className="panel" style={{ padding: '2rem', maxWidth: '400px', margin: '2rem auto' }}>
            <h2 style={{ color: 'var(--neon-blue)', textAlign: 'center', marginBottom: '1.5rem' }}>{user.nombre_completo.toUpperCase()}</h2>
            
            {/* Visualización de la foto de perfil actual */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <img 
                    src={previewUrl} 
                    alt="Perfil" 
                    style={{ 
                        width: '150px', 
                        height: '150px', 
                        borderRadius: '50%', 
                        objectFit: 'cover', 
                        border: '3px solid var(--neon-blue)',
                        marginBottom: '1rem'
                    }} 
                />
            </div>

            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input 
                    type="text" value={formData.nombre_completo} required placeholder="Nombre Completo"
                    onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})} 
                />
                <input 
                    type="text" value={formData.dpi} required placeholder="DPI"
                    onChange={(e) => setFormData({...formData, dpi: e.target.value})} 
                />
                
                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Actualizar Fotografía:</label>
                <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            setArchivo({ base64: reader.result, name: file.name });
                            setPreviewUrl(reader.result); // Actualiza la imagen en tiempo real antes de guardar
                        };
                        reader.readAsDataURL(file);
                    }
                }} />
                
                <hr style={{ borderColor: 'var(--border-color)', margin: '1rem 0' }} />

                <input 
                    type="password" placeholder="Contraseña Actual (Obligatoria)" required
                    onChange={(e) => setFormData({...formData, contrasena_actual: e.target.value})} 
                />
                <button type="submit">Guardar Cambios</button>
            </form>
        </div>
    );
}