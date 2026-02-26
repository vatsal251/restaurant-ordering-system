import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const api = axios.create({ baseURL: API_BASE })

api.interceptors.request.use((config) => {
    const auth = JSON.parse(localStorage.getItem('admin-auth') || '{}')
    const token = auth?.state?.token
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('admin-auth')
            window.location.href = '/'
        }
        return Promise.reject(error)
    }
)

export default api
