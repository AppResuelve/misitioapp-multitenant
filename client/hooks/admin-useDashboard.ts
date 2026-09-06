// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import api from '@/services/admin-api'

export function useDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}
