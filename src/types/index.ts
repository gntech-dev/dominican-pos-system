/**
 * TypeScript types for Dominican Republic POS System
 */

export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER'

export type CustomerType = 'INDIVIDUAL' | 'BUSINESS'

export type NcfType = 'B01' | 'B02' | 'B03' | 'B04'

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK' | 'CREDIT'

export type SaleStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'SALE_CREATE' 
  | 'SALE_CANCEL' 
  | 'NCF_GENERATE'

export interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  role: UserRole
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  rnc?: string // RNC for business customers
  cedula?: string // Cedula for individual customers
  address?: string
  city?: string
  isActive: boolean
  customerType: CustomerType
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  code: string
  name: string
  description?: string
  price: number
  cost?: number
  stock: number
  minStock: number
  isActive: boolean
  taxable: boolean // Subject to ITBIS
  categoryId?: string
  category?: Category
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Sale {
  id: string
  saleNumber: string
  ncf?: string // Generated NCF
  ncfType?: NcfType
  subtotal: number
  itbis: number // 18% tax
  total: number
  paymentMethod: PaymentMethod
  status: SaleStatus
  notes?: string
  cashierId: string
  customerId?: string
  ncfSequenceId?: string
  createdAt: Date
  updatedAt: Date
  
  // Relations
  cashier?: User
  customer?: Customer
  items?: SaleItem[]
}

export interface SaleItem {
  id: string
  quantity: number
  unitPrice: number
  total: number
  saleId: string
  productId: string
  createdAt: Date
  
  // Relations
  product?: Product
}

export interface NcfSequence {
  id: string
  type: NcfType
  currentNumber: number
  maxNumber: number
  isActive: boolean
  expiryDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface RncRegistry {
  id: string
  rnc: string
  name: string
  status: string
  category?: string
  lastSync: Date
}

export interface AuditLog {
  id: string
  action: AuditAction
  entityType: string
  entityId: string
  oldValue?: any
  newValue?: any
  userId: string
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  user?: User
}

export interface SystemConfig {
  id: string
  key: string
  value: string
  description?: string
  updatedAt: Date
}

export interface BusinessSettings {
  id: string
  name: string
  rnc: string
  address: string
  phone: string
  email: string
  website?: string
  logo?: string
  slogan?: string
  city: string
  province: string
  country: string
  postalCode?: string
  taxRegime: string
  economicActivity?: string
  receiptFooter?: string
  invoiceTerms?: string
  warrantyInfo?: string
  isActive: boolean
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

// Form types
export interface CreateUserForm {
  email: string
  username: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
}

export interface CreateCustomerForm {
  name: string
  email?: string
  phone?: string
  rnc?: string
  cedula?: string
  address?: string
  city?: string
  customerType: CustomerType
}

export interface CreateProductForm {
  code: string
  name: string
  description?: string
  price: number
  cost?: number
  stock: number
  minStock: number
  taxable: boolean
  categoryId?: string
}

export interface CreateSaleForm {
  customerId?: string
  paymentMethod: PaymentMethod
  notes?: string
  items: CreateSaleItemForm[]
}

export interface CreateSaleItemForm {
  productId: string
  quantity: number
  unitPrice: number
}

export interface CreateBusinessSettingsForm {
  name: string
  rnc: string
  address: string
  phone: string
  email: string
  website?: string
  slogan?: string
  city: string
  province: string
  country: string
  postalCode?: string
  taxRegime: string
  economicActivity?: string
  receiptFooter?: string
  invoiceTerms?: string
  warrantyInfo?: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Receipt types
export interface ReceiptData {
  sale: Sale
  business: {
    name: string
    rnc: string
    address: string
    phone: string
  }
  cashierName: string
  customerName?: string
  customerRnc?: string
}

// Dashboard types
export interface DashboardStats {
  todaySales: number
  todayTransactions: number
  lowStockProducts: number
  totalCustomers: number
  monthlyRevenue: number[]
  topProducts: Array<{
    productName: string
    quantitySold: number
    revenue: number
  }>
}
