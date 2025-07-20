-- =====================================================
-- Migration: Update Workers ID Card Fields
-- Description: Update workers table to support separate front and back ID card images
-- Version: 009
-- Date: 2024-01-25
-- =====================================================

-- Add new columns for front and back ID card images
ALTER TABLE workers 
ADD COLUMN IF NOT EXISTS id_card_front_url TEXT,
ADD COLUMN IF NOT EXISTS id_card_back_url TEXT;

-- Migrate existing data from identification_image_url to id_card_front_url
UPDATE workers 
SET id_card_front_url = identification_image_url 
WHERE identification_image_url IS NOT NULL 
AND id_card_front_url IS NULL;

-- Drop the old column (after data migration)
ALTER TABLE workers 
DROP COLUMN IF EXISTS identification_image_url;

-- Add comments for the new columns
COMMENT ON COLUMN workers.id_card_front_url IS 'URL to front side of ID card image';
COMMENT ON COLUMN workers.id_card_back_url IS 'URL to back side of ID card image';

-- Update any existing indexes if needed
-- (No specific indexes needed for these URL fields)

-- Verify the migration
DO $$
BEGIN
    -- Check if the new columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workers' 
        AND column_name = 'id_card_front_url'
    ) THEN
        RAISE EXCEPTION 'Migration failed: id_card_front_url column not found';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workers' 
        AND column_name = 'id_card_back_url'
    ) THEN
        RAISE EXCEPTION 'Migration failed: id_card_back_url column not found';
    END IF;
    
    -- Check if the old column is removed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workers' 
        AND column_name = 'identification_image_url'
    ) THEN
        RAISE EXCEPTION 'Migration failed: identification_image_url column still exists';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully: Workers ID card fields updated';
END $$;
