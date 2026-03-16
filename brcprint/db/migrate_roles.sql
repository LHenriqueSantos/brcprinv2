-- Add role column to admins table
ALTER TABLE admins ADD COLUMN role ENUM('admin', 'vendedor', 'operador') NOT NULL DEFAULT 'operador';

-- Set existing admins to 'admin' role
UPDATE admins SET role = 'admin' WHERE username = 'admin' OR active = 1;
