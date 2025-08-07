/**
 * Enhanced TypeScript types for Dominican Republic POS System
 * Including Employee Management, Advanced Inventory, and Hardware Integration
 */

// Base types
export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER'
export type CustomerType = 'INDIVIDUAL' | 'BUSINESS'
export type NcfType = 'B01' | 'B02' | 'B03' | 'B04' | 'B11' | 'B12' | 'B13' | 'B14' | 'B15' | 'B16' | 'B17'
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK' | 'CREDIT'
export type SaleStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'SALE_CREATE' | 'SALE_CANCEL' | 'NCF_GENERATE'

// Employee Management Types
export type SalaryType = 'FIXED' | 'HOURLY' | 'COMMISSION' | 'HYBRID'
export type TimeEntryStatus = 'ACTIVE' | 'COMPLETED' | 'BREAK' | 'OVERTIME'
export type ShiftType = 'REGULAR' | 'OVERTIME' | 'HOLIDAY' | 'WEEKEND'
export type ShiftStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'CANCELLED'

// Inventory Management Types
export type PurchaseOrderStatus = 'PENDING' | 'ORDERED' | 'PARTIAL_RECEIVED' | 'RECEIVED' | 'CANCELLED'
export type StockTransferStatus = 'PENDING' | 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED'
export type AlertType = 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK' | 'REORDER_POINT' | 'EXPIRY_WARNING'
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

// Hardware Integration Types
export type HardwareType = 'THERMAL_PRINTER' | 'BARCODE_SCANNER' | 'CASH_DRAWER' | 'CARD_READER' | 'SCALE' | 'CUSTOMER_DISPLAY'
export type ConnectionType = 'USB' | 'SERIAL' | 'BLUETOOTH' | 'WIFI' | 'ETHERNET' | 'PARALLEL'
export type PrintJobType = 'RECEIPT' | 'INVOICE' | 'REPORT' | 'LABEL' | 'BARCODE'
export type PrintJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
export type HardwareStatusType = 'ONLINE' | 'OFFLINE' | 'ERROR' | 'MAINTENANCE' | 'LOW_PAPER' | 'LOW_INK' | 'PAPER_JAM' | 'CONNECTION_LOST'

// User and Employee interfaces
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
  employeeProfile?: EmployeeProfile
}

export interface EmployeeProfile {
  id: string
  userId: string
  employeeCode: string
  hireDate: Date
  position: string
  department?: string
  salaryType: SalaryType
  baseSalary?: number
  commissionRate: number
  hourlyRate?: number
  targetSales?: number
  emergencyContact?: string
  emergencyPhone?: string
  address?: string
  photoUrl?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  user?: User
  timeEntries?: TimeEntry[]
  shifts?: EmployeeShift[]
  performance?: EmployeePerformance[]
}

export interface TimeEntry {
  id: string
  employeeId: string
  clockIn: Date
  clockOut?: Date
  breakStart?: Date
  breakEnd?: Date
  totalHours: number
  overtimeHours: number
  notes?: string
  location?: string
  ipAddress?: string
  status: TimeEntryStatus
  createdAt: Date
  updatedAt: Date
  employee?: EmployeeProfile
}

export interface EmployeeShift {
  id: string
  employeeId: string
  shiftDate: Date
  startTime: Date
  endTime: Date
  breakDuration: number
  shiftType: ShiftType
  status: ShiftStatus
  notes?: string
  createdAt: Date
  updatedAt: Date
  employee?: EmployeeProfile
}

export interface EmployeePerformance {
  id: string
  employeeId: string
  periodStart: Date
  periodEnd: Date
  salesCount: number
  salesAmount: number
  commissionEarned: number
  hoursWorked: number
  targetsMet: number
  customerRating?: number
  performanceScore?: number
  createdAt: Date
  updatedAt: Date
  employee?: EmployeeProfile
}

// Enhanced Product and Inventory interfaces
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
  taxable: boolean
  barcode?: string
  reorderPoint: number
  maxStock?: number
  supplierId?: string
  categoryId?: string
  createdAt: Date
  updatedAt: Date
  category?: Category
  supplier?: Supplier
  variants?: ProductVariant[]
  inventoryAlerts?: InventoryAlert[]
}

export interface Category {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  products?: Product[]
}

export interface Supplier {
  id: string
  name: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country: string
  rnc?: string
  taxId?: string
  paymentTerms?: string
  creditLimit?: number
  discountPercentage: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  products?: Product[]
  purchaseOrders?: PurchaseOrder[]
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  supplierId: string
  orderDate: Date
  expectedDate?: Date
  receivedDate?: Date
  subtotal: number
  taxAmount: number
  totalAmount: number
  status: PurchaseOrderStatus
  notes?: string
  createdBy: string
  receivedBy?: string
  createdAt: Date
  updatedAt: Date
  supplier?: Supplier
  creator?: User
  receiver?: User
  items?: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
  id: string
  purchaseOrderId: string
  productId: string
  quantityOrdered: number
  quantityReceived: number
  unitCost: number
  totalCost: number
  createdAt: Date
  purchaseOrder?: PurchaseOrder
  product?: Product
}

export interface StockTransfer {
  id: string
  transferNumber: string
  fromLocation: string
  toLocation: string
  transferDate: Date
  status: StockTransferStatus
  notes?: string
  createdBy: string
  approvedBy?: string
  receivedBy?: string
  createdAt: Date
  updatedAt: Date
  creator?: User
  approver?: User
  receiver?: User
  items?: StockTransferItem[]
}

export interface StockTransferItem {
  id: string
  transferId: string
  productId: string
  quantitySent: number
  quantityReceived: number
  createdAt: Date
  transfer?: StockTransfer
  product?: Product
}

export interface InventoryAlert {
  id: string
  productId: string
  alertType: AlertType
  threshold: number
  currentStock: number
  message: string
  severity: AlertSeverity
  isAcknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: Date
  createdAt: Date
  product?: Product
  acknowledger?: User
}

export interface ProductVariant {
  id: string
  productId: string
  variantName: string
  variantValue: string
  sku?: string
  barcode?: string
  price?: number
  cost?: number
  stock: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  product?: Product
}

// Hardware Integration interfaces
export interface PosHardware {
  id: string
  deviceType: HardwareType
  deviceName: string
  deviceModel?: string
  connectionType: ConnectionType
  connectionString?: string
  isEnabled: boolean
  isOnline: boolean
  lastPing?: Date
  configuration?: any
  createdAt: Date
  updatedAt: Date
  printJobs?: PrintJob[]
  statusLogs?: HardwareStatus[]
}

export interface PrintJob {
  id: string
  printerId: string
  jobType: PrintJobType
  content: string
  priority: number
  status: PrintJobStatus
  attempts: number
  maxAttempts: number
  errorMessage?: string
  createdBy: string
  processedAt?: Date
  createdAt: Date
  updatedAt: Date
  printer?: PosHardware
  creator?: User
}

export interface HardwareStatus {
  id: string
  deviceId: string
  status: HardwareStatusType
  message?: string
  data?: any
  timestamp: Date
  device?: PosHardware
}

// Existing core interfaces
export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  rnc?: string
  cedula?: string
  address?: string
  city?: string
  isActive: boolean
  customerType: CustomerType
  createdAt: Date
  updatedAt: Date
  sales?: Sale[]
}

export interface Sale {
  id: string
  saleNumber: string
  ncf?: string
  ncfType?: NcfType
  subtotal: number
  itbis: number
  total: number
  paymentMethod: PaymentMethod
  status: SaleStatus
  notes?: string
  cashierId: string
  customerId?: string
  ncfSequenceId?: string
  customerRnc?: string
  customerName?: string
  createdAt: Date
  updatedAt: Date
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
  sale?: Sale
  product?: Product
}

// Dashboard and Analytics interfaces
export interface DashboardStats {
  totalSales: number
  totalRevenue: number
  totalCustomers: number
  lowStockProducts: number
  pendingOrders: number
  employeesOnDuty: number
  hardwareStatus: {
    online: number
    offline: number
    error: number
  }
}

export interface EmployeeDashboard {
  clockInTime?: Date
  currentShift?: EmployeeShift
  todaysSales: number
  todaysCommission: number
  weeklyHours: number
  performanceScore?: number
}

export interface SalesAnalytics {
  dailySales: Array<{
    date: string
    sales: number
    revenue: number
  }>
  topProducts: Array<{
    id: string
    name: string
    sales: number
    revenue: number
  }>
  paymentMethods: Array<{
    method: string
    count: number
    amount: number
  }>
  employeePerformance: Array<{
    employeeId: string
    name: string
    sales: number
    commission: number
  }>
}

export interface InventoryAnalytics {
  totalProducts: number
  totalValue: number
  lowStockCount: number
  outOfStockCount: number
  reorderNeeded: number
  topCategories: Array<{
    id: string
    name: string
    productCount: number
    value: number
  }>
  stockMovement: Array<{
    date: string
    incoming: number
    outgoing: number
  }>
  alerts: InventoryAlert[]
}

// API and Form interfaces
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Clock In/Out interfaces
export interface ClockInRequest {
  employeeId: string
  location?: string
}

export interface ClockOutRequest {
  employeeId: string
  notes?: string
}

export interface BreakRequest {
  employeeId: string
  breakType: 'START' | 'END'
}

// Commission interfaces
export interface CommissionCalculation {
  employeeId: string
  period: {
    start: Date
    end: Date
  }
  baseSalary: number
  commissionRate: number
  totalSales: number
  totalCommission: number
  breakdown: Array<{
    saleId: string
    saleAmount: number
    commissionEarned: number
    date: Date
  }>
}

// Hardware Control interfaces
export interface PrinterCommand {
  command: 'PRINT' | 'STATUS' | 'RESET' | 'FEED_PAPER' | 'CUT_PAPER'
  data?: any
}

export interface CashDrawerCommand {
  command: 'OPEN' | 'STATUS'
}

export interface BarcodeReaderConfig {
  enabled: boolean
  autoProcess: boolean
  soundOnScan: boolean
  prefix?: string
  suffix?: string
}

// Form interfaces for creation/updates
export interface CreateEmployeeRequest {
  userId: string
  employeeCode: string
  hireDate: Date
  position: string
  department?: string
  salaryType: SalaryType
  baseSalary?: number
  commissionRate?: number
  hourlyRate?: number
  targetSales?: number
  emergencyContact?: string
  emergencyPhone?: string
  address?: string
}

export interface CreatePurchaseOrderRequest {
  supplierId: string
  expectedDate?: Date
  notes?: string
  items: Array<{
    productId: string
    quantity: number
    unitCost: number
  }>
}

export interface CreateStockTransferRequest {
  fromLocation: string
  toLocation: string
  notes?: string
  items: Array<{
    productId: string
    quantity: number
  }>
}

export interface CreateProductVariantRequest {
  productId: string
  variantName: string
  variantValue: string
  sku?: string
  barcode?: string
  price?: number
  cost?: number
  stock?: number
}

export interface HardwareConfigRequest {
  deviceType: HardwareType
  deviceName: string
  deviceModel?: string
  connectionType: ConnectionType
  connectionString?: string
  configuration?: any
}

// Report interfaces
export interface EmployeeReport {
  employee: EmployeeProfile
  period: {
    start: Date
    end: Date
  }
  totalHours: number
  regularHours: number
  overtimeHours: number
  totalSales: number
  totalCommission: number
  attendance: number
  performance: EmployeePerformance[]
}

export interface InventoryReport {
  products: Product[]
  alerts: InventoryAlert[]
  lowStockItems: Product[]
  reorderSuggestions: Array<{
    product: Product
    suggestedQuantity: number
    supplier?: Supplier
  }>
  valuation: {
    totalValue: number
    categoryBreakdown: Array<{
      category: string
      value: number
      count: number
    }>
  }
}

export interface HardwareReport {
  devices: PosHardware[]
  statusSummary: {
    online: number
    offline: number
    error: number
  }
  printJobStats: {
    total: number
    completed: number
    failed: number
    pending: number
  }
  recentEvents: HardwareStatus[]
}
