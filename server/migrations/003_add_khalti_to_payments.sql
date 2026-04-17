-- Migration: Add Khalti Gateway to Payments
-- Description: Adds gateway and khalti_pidx columns to support multiple payment processors
-- Date: 2026-04-05

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS gateway VARCHAR(50) DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS khalti_pidx VARCHAR(255);
