-- Production Performance Indexes for POS Dominican Republic
-- Run this after deployment to optimize database performance

-- Sales table indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON "Sale"("createdAt");
CREATE INDEX IF NOT EXISTS idx_sales_ncf ON "Sale"("ncf");
CREATE INDEX IF NOT EXISTS idx_sales_status ON "Sale"("status");
CREATE INDEX IF NOT EXISTS idx_sales_customer ON "Sale"("customerId");
CREATE INDEX IF NOT EXISTS idx_sales_user ON "Sale"("userId");
CREATE INDEX IF NOT EXISTS idx_sales_date_status ON "Sale"("createdAt", "status");

-- Customer table indexes
CREATE INDEX IF NOT EXISTS idx_customers_rnc ON "Customer"("rnc");
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON "Customer"("createdAt");
CREATE INDEX IF NOT EXISTS idx_customers_email ON "Customer"("email");

-- Product table indexes
CREATE INDEX IF NOT EXISTS idx_products_sku ON "Product"("sku");
CREATE INDEX IF NOT EXISTS idx_products_category ON "Product"("categoryId");
CREATE INDEX IF NOT EXISTS idx_products_active ON "Product"("isActive");
CREATE INDEX IF NOT EXISTS idx_products_stock ON "Product"("stock");

-- SaleItem table indexes for report generation
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON "SaleItem"("productId");
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON "SaleItem"("saleId");

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON "AuditLog"("tableName");

-- NCF sequence indexes
CREATE INDEX IF NOT EXISTS idx_ncf_sequences_type ON "NCFSequence"("type");
CREATE INDEX IF NOT EXISTS idx_ncf_sequences_active ON "NCFSequence"("isActive");

-- RNC validation indexes  
CREATE INDEX IF NOT EXISTS idx_rnc_companies_rnc ON "RNCCompany"("rnc");
CREATE INDEX IF NOT EXISTS idx_rnc_companies_name ON "RNCCompany"("businessName");

-- Composite indexes for common report queries
CREATE INDEX IF NOT EXISTS idx_sales_date_customer ON "Sale"("createdAt", "customerId");
CREATE INDEX IF NOT EXISTS idx_sales_date_total ON "Sale"("createdAt", "total");
CREATE INDEX IF NOT EXISTS idx_sale_items_product_date ON "SaleItem"("productId", "createdAt");

-- Performance statistics update
ANALYZE "Sale";
ANALYZE "SaleItem"; 
ANALYZE "Customer";
ANALYZE "Product";
ANALYZE "AuditLog";

-- Vacuum for performance
VACUUM ANALYZE;
