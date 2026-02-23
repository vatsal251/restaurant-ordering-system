import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import SealCheckpoint from './pages/SealCheckpoint'
import Earnings from './pages/Earnings'
import Profile from './pages/Profile'

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
                <Route path="/order/:id/seal" element={<ProtectedRoute><SealCheckpoint /></ProtectedRoute>} />
                <Route path="/earnings" element={<ProtectedRoute><Earnings /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}
