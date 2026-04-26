// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useState } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import Chat from './pages/Chat';
import LexBot from './components/LexBot'; // Lo crearemos abajo

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  const Navbar = () => (
    <nav style={{ padding: '1rem', background: '#333', color: 'white', display: 'flex', gap: '1rem' }}>
      <Link to="/feed" style={{ color: 'white' }}>Inicio</Link>
      <Link to="/friends" style={{ color: 'white' }}>Amigos</Link>
      <Link to="/chat" style={{ color: 'white' }}>Chat</Link>
      <Link to="/profile" style={{ color: 'white' }}>Perfil</Link>
      <button onClick={() => { localStorage.removeItem('user'); setUser(null); }}>Salir</button>
    </nav>
  );

  return (
    <Router>
      {user && <Navbar />}
      {user && <LexBot />} {/* Bot flotante de Lex */}
      <Routes>
        <Route path="/" element={!user ? <Login setUser={setUser} /> : <Navigate to="/feed" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/feed" />} />
        <Route path="/feed" element={user ? <Feed user={user} /> : <Navigate to="/" />} />
        <Route path="/profile" element={user ? <Profile user={user} setUser={setUser} /> : <Navigate to="/" />} />
        <Route path="/friends" element={user ? <Friends user={user} /> : <Navigate to="/" />} />
        <Route path="/chat" element={user ? <Chat user={user} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;