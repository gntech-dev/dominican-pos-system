-- Time tracking system
CREATE TABLE IF NOT EXISTS "time_entries" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "clock_in" TIMESTAMP(3) NOT NULL,
    "clock_out" TIMESTAMP(3),
    "break_start" TIMESTAMP(3),
    "break_end" TIMESTAMP(3),
    "total_hours" DECIMAL(4,2) DEFAULT 0.00,
    "overtime_hours" DECIMAL(4,2) DEFAULT 0.00,
    "notes" TEXT,
    "location" TEXT,
    "ip_address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

-- Employee shifts and scheduling
CREATE TABLE IF NOT EXISTS "employee_shifts" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "shift_date" DATE NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "break_duration" INTEGER DEFAULT 30,
    "shift_type" TEXT NOT NULL DEFAULT 'REGULAR',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_shifts_pkey" PRIMARY KEY ("id")
);

-- Employee performance tracking
CREATE TABLE IF NOT EXISTS "employee_performance" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "sales_count" INTEGER DEFAULT 0,
    "sales_amount" DECIMAL(12,2) DEFAULT 0.00,
    "commission_earned" DECIMAL(10,2) DEFAULT 0.00,
    "hours_worked" DECIMAL(6,2) DEFAULT 0.00,
    "targets_met" INTEGER DEFAULT 0,
    "customer_rating" DECIMAL(3,2),
    "performance_score" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_performance_pkey" PRIMARY KEY ("id")
);

-- Create foreign key constraints
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'time_entries_employee_id_fkey'
    ) THEN
        ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_employee_id_fkey" 
        FOREIGN KEY ("employee_id") REFERENCES "employee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'employee_shifts_employee_id_fkey'
    ) THEN
        ALTER TABLE "employee_shifts" ADD CONSTRAINT "employee_shifts_employee_id_fkey" 
        FOREIGN KEY ("employee_id") REFERENCES "employee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'employee_performance_employee_id_fkey'
    ) THEN
        ALTER TABLE "employee_performance" ADD CONSTRAINT "employee_performance_employee_id_fkey" 
        FOREIGN KEY ("employee_id") REFERENCES "employee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "time_entries_employee_id_idx" ON "time_entries"("employee_id");
CREATE INDEX IF NOT EXISTS "time_entries_clock_in_idx" ON "time_entries"("clock_in");
CREATE INDEX IF NOT EXISTS "employee_shifts_employee_id_idx" ON "employee_shifts"("employee_id");
CREATE INDEX IF NOT EXISTS "employee_shifts_shift_date_idx" ON "employee_shifts"("shift_date");
CREATE INDEX IF NOT EXISTS "employee_performance_employee_id_idx" ON "employee_performance"("employee_id");
