import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

const ProtectedRoute = ({ children }) => {
    const token = useAuthStore(s => s.token)
    return token ? children : <Navigate to="/login" replace />
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                {/* The Dashboard handles its own tab routing internally */}
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}
