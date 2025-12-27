-- Check existing columns (optional)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users';

-- Add role column (default to 'corporate' or choose your default)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'corporate';

-- Add org_name column (nullable)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS org_name VARCHAR(255);
