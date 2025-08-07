-- Employee Management System Enhancement
-- Adding comprehensive employee features beyond basic users

-- Employee profiles with extended information
CREATE TABLE IF NOT EXISTS "employee_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "employee_code" TEXT NOT NULL,
    "hire_date" TIMESTAMP(3) NOT NULL,
    "position" TEXT NOT NULL,
    "department" TEXT,
    "salary_type" TEXT NOT NULL DEFAULT 'FIXED',
    "base_salary" DECIMAL(10,2),
    "commission_rate" DECIMAL(5,2) DEFAULT 0.00,
    "hourly_rate" DECIMAL(8,2),
    "target_sales" DECIMAL(12,2),
    "emergency_contact" TEXT,
    "emergency_phone" TEXT,
    "address" TEXT,
    "photo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_profiles_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "employee_profiles_user_id_key" ON "employee_profiles"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "employee_profiles_employee_code_key" ON "employee_profiles"("employee_code");

-- Create foreign key constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'employee_profiles_user_id_fkey'
    ) THEN
        ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
