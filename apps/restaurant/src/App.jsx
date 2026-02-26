import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Menu from './pages/Menu'
import SealDispatch from './pages/SealDispatch'
import Analytics from './pages/Analytics'
import Promotions from './pages/Promotions'
import Profile from './pages/Profile'
import { Orders, OrderDetail } from './pages/Stubs'

const ProtectedRoute = ({ children }) => {
    const token = useAuthStore(s => s.token)
    return token ? children : <Navigate to="/login" replace />
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                <Route path="/orders/:id/seal-dispatch" element={<ProtectedRoute><SealDispatch /></ProtectedRoute>} />
                <Route path="/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="/promotions" element={<ProtectedRoute><Promotions /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}
