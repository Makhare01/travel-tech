-- Fix for PostgREST schema cache issue with hyphenated column names
-- Run this SQL in your Supabase SQL Editor

-- Option 1: Create a function to insert rooms (Recommended)
-- This bypasses PostgREST's column name restrictions
CREATE OR REPLACE FUNCTION insert_room(
  p_room_number integer,
  p_room_type varchar,
  p_floor integer,
  p_capacity integer,
  p_status varchar,
  p_amenities varchar
)
RETURNS TABLE (
  id bigint,
  created_at timestamptz,
  "room-number" integer,
  "room-type" varchar,
  floor integer,
  capacity integer,
  status varchar,
  amenities varchar
) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO rooms ("room-number", "room-type", floor, capacity, status, amenities)
  VALUES (p_room_number, p_room_type, p_floor, p_capacity, p_status, p_amenities)
  RETURNING rooms.*;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION insert_room TO authenticated;
GRANT EXECUTE ON FUNCTION insert_room TO anon;

-- Option 2: Create a view for reading (if needed)
CREATE OR REPLACE VIEW rooms_view AS
SELECT 
  id,
  created_at,
  "room-number" as room_number,
  "room-type" as room_type,
  floor,
  capacity,
  status,
  amenities
FROM rooms;

GRANT SELECT ON rooms_view TO authenticated;
GRANT SELECT ON rooms_view TO anon;

-- Option 3: Refresh PostgREST schema cache
-- Go to Supabase Dashboard > Settings > API > and click "Reload Schema"
-- Or restart your Supabase project
