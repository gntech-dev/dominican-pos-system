// Role-based Access Control System for Dominican Republic POS

export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'REPORTER'

export interface RolePermissions {
  // User Management
  users: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
    changeRole: boolean
  }
  // Employee Management
  employees: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
    viewSalary: boolean
    manageSchedule: boolean
  }
  // Sales Management
  sales: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
    refund: boolean
    viewReports: boolean
  }
  // Inventory Management
  inventory: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
    manageSuppliers: boolean
    viewCosts: boolean
  }
  // Financial Management
  financial: {
    viewReports: boolean
    manageNCF: boolean
    configureTaxes: boolean
    viewProfitMargins: boolean
  }
  // System Configuration
  system: {
    manageSettings: boolean
    viewAuditLogs: boolean
    backup: boolean
    integrate: boolean
  }
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  ADMIN: {
    users: {
      create: true,
      read: true,
      update: true,
      delete: true,
      changeRole: true
    },
    employees: {
      create: true,
      read: true,
      update: true,
      delete: true,
      viewSalary: true,
      manageSchedule: true
    },
    sales: {
      create: true,
      read: true,
      update: true,
      delete: true,
      refund: true,
      viewReports: true
    },
    inventory: {
      create: true,
      read: true,
      update: true,
      delete: true,
      manageSuppliers: true,
      viewCosts: true
    },
    financial: {
      viewReports: true,
      manageNCF: true,
      configureTaxes: true,
      viewProfitMargins: true
    },
    system: {
      manageSettings: true,
      viewAuditLogs: true,
      backup: true,
      integrate: true
    }
  },
  MANAGER: {
    users: {
      create: false,
      read: true,
      update: false,
      delete: false,
      changeRole: false
    },
    employees: {
      create: true,
      read: true,
      update: true,
      delete: false,
      viewSalary: true,
      manageSchedule: true
    },
    sales: {
      create: true,
      read: true,
      update: true,
      delete: false,
      refund: true,
      viewReports: true
    },
    inventory: {
      create: true,
      read: true,
      update: true,
      delete: false,
      manageSuppliers: true,
      viewCosts: true
    },
    financial: {
      viewReports: true,
      manageNCF: false,
      configureTaxes: false,
      viewProfitMargins: true
    },
    system: {
      manageSettings: false,
      viewAuditLogs: true,
      backup: false,
      integrate: false
    }
  },
  CASHIER: {
    users: {
      create: false,
      read: false,
      update: false,
      delete: false,
      changeRole: false
    },
    employees: {
      create: false,
      read: true,
      update: false,
      delete: false,
      viewSalary: false,
      manageSchedule: false
    },
    sales: {
      create: true,
      read: true,
      update: false,
      delete: false,
      refund: false,
      viewReports: false
    },
    inventory: {
      create: false,
      read: true,
      update: false,
      delete: false,
      manageSuppliers: false,
      viewCosts: false
    },
    financial: {
      viewReports: false,
      manageNCF: false,
      configureTaxes: false,
      viewProfitMargins: false
    },
    system: {
      manageSettings: false,
      viewAuditLogs: false,
      backup: false,
      integrate: false
    }
  },
  REPORTER: {
    users: {
      create: false,
      read: false,
      update: false,
      delete: false,
      changeRole: false
    },
    employees: {
      create: false,
      read: true,
      update: false,
      delete: false,
      viewSalary: false,
      manageSchedule: false
    },
    sales: {
      create: false,
      read: true,
      update: false,
      delete: false,
      refund: false,
      viewReports: true
    },
    inventory: {
      create: false,
      read: true,
      update: false,
      delete: false,
      manageSuppliers: false,
      viewCosts: false
    },
    financial: {
      viewReports: true,
      manageNCF: false,
      configureTaxes: false,
      viewProfitMargins: true
    },
    system: {
      manageSettings: false,
      viewAuditLogs: true,
      backup: false,
      integrate: false
    }
  }
}

export const ROLE_DESCRIPTIONS: Record<UserRole, { name: string; description: string; permissions: string[] }> = {
  ADMIN: {
    name: 'Administrador',
    description: 'Acceso completo al sistema con permisos para gestionar todos los aspectos del negocio',
    permissions: [
      'Gestión completa de usuarios y roles',
      'Configuración del sistema y respaldos',
      'Acceso a todos los reportes financieros',
      'Gestión de NCF y configuración fiscal',
      'Administración completa de empleados',
      'Control total de inventario y proveedores'
    ]
  },
  MANAGER: {
    name: 'Gerente',
    description: 'Gestión operacional del negocio con acceso a reportes y administración de personal',
    permissions: [
      'Gestión de empleados y horarios',
      'Acceso a reportes de ventas e inventario',
      'Administración de productos y proveedores',
      'Procesamiento de devoluciones',
      'Visualización de márgenes de ganancia',
      'Gestión operacional diaria'
    ]
  },
  CASHIER: {
    name: 'Cajero',
    description: 'Operaciones básicas de venta y consulta de inventario',
    permissions: [
      'Procesamiento de ventas',
      'Consulta de productos e inventario',
      'Visualización de información básica de empleados',
      'Acceso a funciones operativas esenciales'
    ]
  },
  REPORTER: {
    name: 'Reportero',
    description: 'Acceso exclusivo a reportes y análisis de datos del negocio',
    permissions: [
      'Visualización de todos los reportes de ventas',
      'Acceso a reportes financieros y análisis',
      'Consulta de datos de inventario',
      'Visualización de márgenes de ganancia',
      'Acceso a logs de auditoría',
      'Análisis de rendimiento del negocio'
    ]
  }
}

// Helper functions
export function hasPermission(userRole: UserRole, module: keyof RolePermissions, action: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole]
  if (!rolePermissions || !rolePermissions[module]) {
    return false
  }
  
  const modulePermissions = rolePermissions[module] as Record<string, boolean>
  return modulePermissions[action] === true
}

export function canAccessModule(userRole: UserRole, module: keyof RolePermissions): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole]
  if (!rolePermissions || !rolePermissions[module]) {
    return false
  }
  
  const modulePermissions = rolePermissions[module] as Record<string, boolean>
  return Object.values(modulePermissions).some(permission => permission === true)
}

export function getRoleOptions(): Array<{ value: UserRole; label: string; description: string }> {
  return Object.entries(ROLE_DESCRIPTIONS).map(([role, info]) => ({
    value: role as UserRole,
    label: info.name,
    description: info.description
  }))
}

export function validateRoleAssignment(assignerRole: UserRole, targetRole: UserRole): boolean {
  // Only admins can assign admin roles
  if (targetRole === 'ADMIN' && assignerRole !== 'ADMIN') {
    return false
  }
  
  // Only admins and managers can assign manager roles
  if (targetRole === 'MANAGER' && !['ADMIN', 'MANAGER'].includes(assignerRole)) {
    return false
  }
  
  // Only admins and managers can assign reporter roles (sensitive data access)
  if (targetRole === 'REPORTER' && !['ADMIN', 'MANAGER'].includes(assignerRole)) {
    return false
  }
  
  // Everyone can assign cashier roles (if they have user creation permissions)
  return true
}
