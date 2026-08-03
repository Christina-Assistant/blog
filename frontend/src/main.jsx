import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './router/Login/login.jsx';
import MainPage from './router/MainPage/mainpage.jsx';
import UserSettings from './router/User/user.jsx';
import Blog from './router/Blog/blog.jsx';
import './style.css';

function RequireAuth({ children }) {
  const isLoggedIn = window.localStorage.getItem('nebulaLoggedIn') === 'true';

  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/MainPage"
          element={
            <RequireAuth>
              <MainPage />
            </RequireAuth>
          }
        />
        <Route path="/User/:uuid" element={<RequireAuth><UserSettings /></RequireAuth>} />
        <Route path="/blog" element={<RequireAuth><Blog /></RequireAuth>} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<App />);
