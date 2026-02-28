import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'

// Pages — Phase 1
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import RestaurantPage from './pages/RestaurantPage'

// Pages — Phase 2
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderHistory from './pages/OrderHistory'
import OrderTracking from './pages/OrderTracking'

// Unique Seal Feature
import SealVerify from './pages/SealVerify'

// Phase 2 — Group Orders
import GroupOrderSession from './pages/GroupOrderSession'
import GroupOrderBanner from './components/GroupOrderBanner'

// Phase 5 — Polish pages
import Profile from './pages/Profile'

// Phase 7 — Advanced Parity
import Search from './pages/Search'
import Favourites from './pages/Favourites'
import Addresses from './pages/Addresses'
import SurpriseMe from './pages/SurpriseMe'
import AIAssistant from './pages/AIAssistant'

const ProtectedRoute = ({ children }) => {
    const token = useAuthStore(s => s.token)
    return token ? children : <Navigate to="/login" replace />
}

export default function App() {
    return (
        <BrowserRouter>
            <Toaster position="top-center" />
            <GroupOrderBanner />
            <Routes>
                {/* Auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Customer pages */}
                <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
                <Route path="/restaurant/:id" element={<ProtectedRoute><RestaurantPage /></ProtectedRoute>} />
                <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
                <Route path="/orders/:id" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
                <Route path="/orders/:id/seal" element={<ProtectedRoute><SealVerify /></ProtectedRoute>} />
                <Route path="/group-order/:id" element={<ProtectedRoute><GroupOrderSession /></ProtectedRoute>} />
                <Route path="/favourites" element={<ProtectedRoute><Favourites /></ProtectedRoute>} />
                <Route path="/addresses" element={<ProtectedRoute><Addresses /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/surprise" element={<ProtectedRoute><SurpriseMe /></ProtectedRoute>} />
                <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
                <Route path="/group-order/:id" element={<ProtectedRoute><GroupOrderSession /></ProtectedRoute>} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}
