// @ts-nocheck
import { useState, useEffect, useCallback } from 'react'
import api from '@/services/admin-api'

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/admin/categories')
      setCategories(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar categorías')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { categories, loading, error, refetch: fetch }
}
