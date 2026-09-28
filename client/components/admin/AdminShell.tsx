// @ts-nocheck
'use client'

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/components/admin/context/AuthContext"
import { Spinner } from "@/components/admin/ui/Spinner"
import { Skeleton } from "@/components/admin/ui/Skeleton"

const Sidebar = dynamic(() => import("@/components/admin/Sidebar"), { ssr: false })
const Topbar = dynamic(() => import("@/components/admin/Topbar"), { ssr: false })

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/dashboard/products': 'Productos',
  '/dashboard/services': 'Servicios',
  '/dashboard/categories': 'Categorías',
  '/dashboard/tags': 'Etiquetas',
  '/dashboard/discounts': 'Descuentos',
  '/dashboard/media': 'Galería',
  '/dashboard/settings/general': 'General',
  '/dashboard/settings/contact': 'Contacto',
  '/dashboard/settings/billing': 'Facturación',
  '/dashboard/settings/data': 'Datos',
  '/dashboard/settings/help': 'Ayuda',
  '/dashboard/store': 'Tienda',
  '/dashboard/attributes': 'Atributos',
  '/dashboard/change-requests': 'Solicitar cambio',
} as Record<string, string>

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isPublic = pathname.startsWith('/login')
    || pathname.startsWith('/activate')
    || pathname.startsWith('/forgot')
    || pathname.startsWith('/reset')

  useEffect(() => {
    if (!loading && !user && !isPublic) {
      router.push('/login')
    }
  }, [loading, user, isPublic, router])

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  useEffect(() => {
    const businessName = 'Admin'
    const pageTitle = PAGE_TITLES[pathname]
      || Object.entries(PAGE_TITLES).find(([key]) => pathname.startsWith(key))?.[1]
      || 'Admin'
    document.title = `${pageTitle} — ${businessName}`
  }, [pathname])

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex">
      <Skeleton className="w-64 h-screen rounded-none hidden lg:block" />
      <div className="flex-1 flex items-center justify-center">
        <Spinner />
      </div>
    </div>
  )

  if (!user && !isPublic) return null

  if (isPublic) return <>{children}</>

  return (
    <div className="min-h-screen bg-zinc-950">
      <Topbar onMenuOpen={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="ml-0 lg:ml-64 p-4 pt-20 lg:p-6 lg:pt-20 min-h-screen">
        {children}
      </main>
    </div>
  )
}
