-- Create subscriptions table
-- This table manages user subscriptions for notifications

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  promise_id TEXT,
  region TEXT,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'push', 'both')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_promise_id ON subscriptions(promise_id);
CREATE INDEX idx_subscriptions_region ON subscriptions(region);
CREATE INDEX idx_subscriptions_is_active ON subscriptions(is_active);
CREATE INDEX idx_subscriptions_notification_type ON subscriptions(notification_type);

-- Add constraint to ensure either promise_id or region is specified (but not both)
ALTER TABLE subscriptions ADD CONSTRAINT check_subscription_target 
CHECK (
  (promise_id IS NOT NULL AND region IS NULL) OR 
  (promise_id IS NULL AND region IS NOT NULL)
);

-- Add unique constraint to prevent duplicate subscriptions
CREATE UNIQUE INDEX idx_subscriptions_unique_promise 
ON subscriptions(user_id, promise_id) 
WHERE promise_id IS NOT NULL AND is_active = TRUE;

CREATE UNIQUE INDEX idx_subscriptions_unique_region 
ON subscriptions(user_id, region, notification_type) 
WHERE region IS NOT NULL AND is_active = TRUE;

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_subscriptions_updated_at 
BEFORE UPDATE ON subscriptions 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions table
-- Users can only view their own subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON subscriptions FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Users can only insert their own subscriptions
CREATE POLICY "Users can insert their own subscriptions" 
ON subscriptions FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own subscriptions
CREATE POLICY "Users can update their own subscriptions" 
ON subscriptions FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own subscriptions
CREATE POLICY "Users can delete their own subscriptions" 
ON subscriptions FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create function to check if user is subscribed to a promise
CREATE OR REPLACE FUNCTION is_user_subscribed_to_promise(p_user_id UUID, p_promise_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 
    FROM subscriptions 
    WHERE user_id = p_user_id 
    AND promise_id = p_promise_id 
    AND is_active = TRUE
  );
END;
$$ language plpgsql;

-- Create function to check if user is subscribed to a region
CREATE OR REPLACE FUNCTION is_user_subscribed_to_region(p_user_id UUID, p_region TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 
    FROM subscriptions 
    WHERE user_id = p_user_id 
    AND region = p_region 
    AND is_active = TRUE
  );
END;
$$ language plpgsql;

-- Create function to get user's active subscriptions
CREATE OR REPLACE FUNCTION get_user_subscriptions(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  promise_id TEXT,
  region TEXT,
  notification_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.promise_id, s.region, s.notification_type, s.created_at
  FROM subscriptions s
  WHERE s.user_id = p_user_id AND s.is_active = TRUE
  ORDER BY s.created_at DESC;
END;
$$ language plpgsql;