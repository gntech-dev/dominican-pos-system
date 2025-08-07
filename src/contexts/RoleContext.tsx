'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentUser, logout as authLogout } from '@/lib/auth'
import { hasPermission, canAccessModule, UserRole } from '@/lib/roles'

interface User {
  userId: string
  email: string
  role: UserRole
}

interface RoleContextType {
  user: User | null
  loading: boolean
  hasPermission: (module: keyof import('@/lib/roles').RolePermissions, action: string) => boolean
  canAccessModule: (module: keyof import('@/lib/roles').RolePermissions) => boolean
  isRole: (role: UserRole | UserRole[]) => boolean
  refreshUser: () => Promise<void>
  logout: () => void
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = async () => {
    try {
      const hasToken = typeof window !== 'undefined' && localStorage.getItem('token')
      
      if (hasToken) {
        // If there's a token, try to decode it
        const currentUser = getCurrentUser()
        
        if (currentUser) {
          const userWithRole = {
            ...currentUser,
            role: currentUser.role as UserRole
          }
          setUser(userWithRole)
        } else {
          // Token exists but is invalid/expired - getCurrentUser already removed it
          setUser(null)
        }
      } else {
        // No token exists - set user to null (should redirect to login)
        setUser(null)
      }
    } catch (error) {
      console.error('❌ Error loading user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUser()
  }, [])

  const contextValue: RoleContextType = {
    user,
    loading,
    hasPermission: (module, action) => {
      if (!user) return false
      return hasPermission(user.role, module, action)
    },
    canAccessModule: (module) => {
      if (!user) return false
      return canAccessModule(user.role, module)
    },
    isRole: (role) => {
      if (!user) return false
      if (Array.isArray(role)) {
        return role.includes(user.role)
      }
      return user.role === role
    },
    refreshUser: () => {
      return loadUser()
    },
    logout: () => {
      setUser(null)
      authLogout()
    }
  }

  return (
    <RoleContext.Provider value={contextValue}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole(): RoleContextType {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
}

// Higher-order component for role-based rendering
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: UserRole | UserRole[]
) {
  return function RoleProtectedComponent(props: P) {
    const { isRole, loading } = useRole()
    
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      )
    }
    
    if (!isRole(allowedRoles)) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">
            Acceso Denegado
          </div>
          <p className="text-red-700">
            No tienes permisos para acceder a esta sección.
          </p>
        </div>
      )
    }
    
    return <Component {...props} />
  }
}

// Component for conditional role-based rendering
interface RoleGateProps {
  roles?: UserRole | UserRole[]
  permissions?: Array<{
    module: keyof import('@/lib/roles').RolePermissions
    action: string
  }>
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function RoleGate({ roles, permissions, fallback, children }: RoleGateProps) {
  const { isRole, hasPermission: checkPermission, loading } = useRole()
  
  if (loading) {
    return null
  }
  
  let hasAccess = true
  
  // Check role-based access
  if (roles && !isRole(roles)) {
    hasAccess = false
  }
  
  // Check permission-based access  
  if (permissions) {
    const hasAllPermissions = permissions.every(({ module, action }) =>
      checkPermission(module, action)
    )
    if (!hasAllPermissions) {
      hasAccess = false
    }
  }
  
  if (!hasAccess) {
    return <>{fallback || null}</>
  }
  
  return <>{children}</>
}
