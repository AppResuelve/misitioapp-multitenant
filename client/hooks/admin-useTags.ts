'use client'
import { useState, useEffect, useCallback } from 'react'
import api from '@/services/admin-api'

interface TagValue {
  id: number
  value: string
  sortOrder: number
}
interface Tag {
  id: number
  name: string
  color: string
  sortOrder: number
  values: TagValue[]
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTags = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/tags')
      setTags(data)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTags() }, [fetchTags])

  return { tags, loading, refetch: fetchTags }
}
