/*
  # Add doctors table and location data

  1. New Tables
    - `doctors`
      - `id` (uuid, primary key)
      - `name` (text)
      - `specialty` (text)
      - `image_url` (text)
      - `rating` (decimal)
      - `reviews_count` (integer)
      - `latitude` (decimal)
      - `longitude` (decimal)
      - `address` (text)
      - `available` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on doctors table
    - Add policy for authenticated users to read doctors data
*/

CREATE TABLE doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialty text NOT NULL,
  image_url text,
  rating decimal(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  reviews_count integer DEFAULT 0,
  latitude decimal(10,8) NOT NULL,
  longitude decimal(11,8) NOT NULL,
  address text NOT NULL,
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view doctors"
  ON doctors FOR SELECT
  TO authenticated
  USING (true);

-- Insert sample data
INSERT INTO doctors (name, specialty, image_url, rating, reviews_count, latitude, longitude, address, available) VALUES
  ('Dr. Sarah Johnson', 'Ophthalmologist', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=300&h=300&auto=format&fit=crop', 4.9, 127, 40.7128, -74.0060, 'New York, NY', true),
  ('Dr. Michael Chen', 'Optometrist', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=300&h=300&auto=format&fit=crop', 4.8, 98, 40.7589, -73.9851, 'Manhattan, NY', true),
  ('Dr. Emily Williams', 'Ophthalmologist', 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=300&h=300&auto=format&fit=crop', 4.7, 156, 40.7549, -73.9840, 'Manhattan, NY', false);