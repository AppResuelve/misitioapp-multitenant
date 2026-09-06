'use client'
// @ts-nocheck
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

let isLoggingOut = false

export const resetLogoutFlag = () => {
  isLoggingOut = false
}

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => {
    const newToken = response.headers['x-new-token']
    if (newToken) {
      localStorage.setItem('token', newToken)
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401 && !isLoggingOut) {
      isLoggingOut = true
      window.dispatchEvent(new CustomEvent('auth:logout'))
    }
    return Promise.reject(error)
  }
)

export default api

export async function uploadImage(file: any, folder = 'productos') {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('folder', folder)
  const { data } = await api.post('/admin/upload', formData)
  return data
}
