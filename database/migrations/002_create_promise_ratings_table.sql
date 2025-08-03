-- Create promise_ratings table
-- This table stores user ratings and reviews for promises

CREATE TABLE promise_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promise_id TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  helpful_count INTEGER DEFAULT 0 CHECK (helpful_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_promise_ratings_promise_id ON promise_ratings(promise_id);
CREATE INDEX idx_promise_ratings_user_id ON promise_ratings(user_id);
CREATE INDEX idx_promise_ratings_rating ON promise_ratings(rating);
CREATE INDEX idx_promise_ratings_created_at ON promise_ratings(created_at);
CREATE INDEX idx_promise_ratings_helpful_count ON promise_ratings(helpful_count);

-- Add unique constraint to prevent duplicate ratings from same user for same promise
CREATE UNIQUE INDEX idx_promise_ratings_unique_user_promise 
ON promise_ratings(promise_id, user_id);

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_promise_ratings_updated_at 
BEFORE UPDATE ON promise_ratings 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE promise_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promise_ratings table
-- Anyone can view ratings (public data)
CREATE POLICY "Promise ratings are viewable by everyone" 
ON promise_ratings FOR SELECT 
USING (true);

-- Only authenticated users can insert ratings
CREATE POLICY "Authenticated users can insert ratings" 
ON promise_ratings FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own ratings
CREATE POLICY "Users can update their own ratings" 
ON promise_ratings FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own ratings
CREATE POLICY "Users can delete their own ratings" 
ON promise_ratings FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create function to get average rating for a promise
CREATE OR REPLACE FUNCTION get_promise_average_rating(p_promise_id TEXT)
RETURNS DECIMAL(3,2) AS $$
BEGIN
  RETURN (
    SELECT ROUND(AVG(rating)::DECIMAL, 2)
    FROM promise_ratings 
    WHERE promise_id = p_promise_id
  );
END;
$$ language plpgsql;

-- Create function to get rating count for a promise
CREATE OR REPLACE FUNCTION get_promise_rating_count(p_promise_id TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM promise_ratings 
    WHERE promise_id = p_promise_id
  );
END;
$$ language plpgsql;