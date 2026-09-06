// @ts-nocheck
'use client'
import { useState, useEffect, useCallback } from 'react'
import api from '@/services/admin-api'

export function useChangeRequests() {
  const [requests, setRequests] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/change-requests', { params: { page: p, limit: 20 } })
      setRequests(data.requests)
      setTotal(data.total)
      setPage(data.page)
      setTotalPages(data.totalPages)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  return { requests, total, page, totalPages, loading, refetch: fetch }
}

export function useChangeRequestsRemaining() {
  const [limit, setLimit] = useState(2)
  const [used, setUsed] = useState(0)

  useEffect(() => {
    api.get('/admin/change-requests/remaining')
      .then(({ data }) => {
        setLimit(data.limit)
        setUsed(data.used)
      })
      .catch(() => {})
  }, [])

  return { limit, used, remaining: limit - used, canRequest: used < limit, refetch: () => {} }
}

export function useModules() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/change-requests/modules')
      .then(({ data }) => {
        setCategories(Array.isArray(data) ? data : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { categories, loading }
}
