// @ts-nocheck
import { useState, useEffect, useCallback } from 'react'
import api from '@/services/admin-api'

export function useProducts(params = {}) {
  const [data, setData] = useState({ products: [], total: 0, page: 1, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: response } = await api.get('/admin/products', { params })
      setData(response)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(params)])

  useEffect(() => {
    fetch()
  }, [fetch])

  const updateProduct = (id, changes) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.map((p) => p.id === id ? { ...p, ...changes } : p),
    }))
  }

  return { ...data, loading, error, refetch: fetch, updateProduct }
}

export function useProduct(id) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id || id === 'new') {
      setLoading(false)
      return
    }
    setLoading(true)
    api.get(`/admin/products/${id}`)
      .then(({ data }) => setProduct(data))
      .catch((err) => setError(err.response?.data?.error || 'Error al cargar producto'))
      .finally(() => setLoading(false))
  }, [id])

  return { product, loading, error }
}
