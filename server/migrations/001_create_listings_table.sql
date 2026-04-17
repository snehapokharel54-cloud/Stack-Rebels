-- Migration: Create Listings Table
-- Description: Creates the listings table for property listings with draft/publish capability
-- Date: 2026-03-29

BEGIN;

CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic Info
  title VARCHAR(255),
  description TEXT,
  category VARCHAR(100), -- 'entire_place', 'private_room', 'shared_room'
  status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED')),
  
  -- Address (stores as JSON object)
  address JSONB, -- { street, city, province, country, postal_code, lat, lng }
  
  -- Floor Plan (stores as JSON object)
  floor_plan JSONB, -- { guests, beds, bedrooms, bathrooms }
  
  -- Amenities (stores as JSON array)
  amenities JSONB DEFAULT '[]'::jsonb, -- ['wifi', 'parking', 'pool', ...]
  
  -- Photos
  photos JSONB DEFAULT '[]'::jsonb, -- [{ url, caption }, ...]
  
  -- Pricing & Availability
  price_per_night DECIMAL(10, 2),
  minimum_night_stay INTEGER DEFAULT 1,
  maximum_night_stay INTEGER,
  
  -- Booking Settings
  instant_book_enabled BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for common queries (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_listings_host_id ON listings(host_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function (drop and recreate if exists)
DROP TRIGGER IF EXISTS listings_update_timestamp ON listings;
CREATE TRIGGER listings_update_timestamp
BEFORE UPDATE ON listings
FOR EACH ROW
EXECUTE FUNCTION update_listings_updated_at();

COMMIT;
