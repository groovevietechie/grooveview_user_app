-- Add profile fields to customers table
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
