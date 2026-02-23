import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const api = axios.create({ baseURL: API_BASE })

api.interceptors.request.use((config) => {
    const auth = JSON.parse(localStorage.getItem('customer-auth') || '{}')
    const token = auth?.state?.token
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

export default api
