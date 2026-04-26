// frontend/src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import Chat from './pages/Chat';
import LexBot from './components/LexBot';

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <Router>
            {/* Esta es la capa global que da el efecto de monitor viejo */}
            <div className="crt-overlay"></div>

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px', position: 'relative', zIndex: 1 }}>
                
                {/* Header Estilo Pip-Boy */}
                <header style={{ border: '2px solid var(--pip-green)', padding: '15px 20px', marginBottom: '20px', background: 'var(--pip-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontFamily: '"VT323", monospace', fontSize: '2rem', letterSpacing: '4px', textShadow: '0 0 10px var(--pip-green-glow)' }}>
                            SYS.<span>SEMI-SOCIAL</span>
                        </h1>
                    </div>
                    {user && (
                        <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--pip-green-dim)' }}>
                            <div>USUARIO: {user.nombre_completo.toUpperCase()}</div>
                            <div>ESTADO: ONLINE</div>
                            <button onClick={handleLogout} style={{ padding: '2px 8px', fontSize: '0.7rem', marginTop: '5px', borderColor: 'var(--pip-red)', color: 'var(--pip-red)' }}>DESCONECTAR</button>
                        </div>
                    )}
                </header>

                {/* Navegación Estilo Pip-Boy */}
                {user && (
                    <nav className="pip-nav">
                        <Link to="/">FEED</Link>
                        <Link to="/friends">RED</Link>
                        <Link to="/chat">COMUNICACIONES</Link>
                        <Link to="/profile">PERFIL</Link>
                    </nav>
                )}

                <Routes>
                    <Route path="/" element={user ? <Feed user={user} /> : <Login setUser={setUser} />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/profile" element={user ? <Profile user={user} setUser={setUser} /> : <Navigate to="/" />} />
                    <Route path="/friends" element={user ? <Friends user={user} /> : <Navigate to="/" />} />
                    <Route path="/chat" element={user ? <Chat user={user} /> : <Navigate to="/" />} />
                </Routes>
            </div>
            
            {user && <LexBot user={user} />}
        </Router>
    );
}

export default App;