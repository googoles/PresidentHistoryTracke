-- Create citizen_reports table
-- This table stores citizen-submitted reports about promise progress

CREATE TABLE citizen_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promise_id TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('news', 'photo', 'progress_update', 'concern')),
  title TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  location TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  upvotes INTEGER DEFAULT 0 CHECK (upvotes >= 0),
  downvotes INTEGER DEFAULT 0 CHECK (downvotes >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_citizen_reports_promise_id ON citizen_reports(promise_id);
CREATE INDEX idx_citizen_reports_user_id ON citizen_reports(user_id);
CREATE INDEX idx_citizen_reports_report_type ON citizen_reports(report_type);
CREATE INDEX idx_citizen_reports_verified ON citizen_reports(verified);
CREATE INDEX idx_citizen_reports_created_at ON citizen_reports(created_at);
CREATE INDEX idx_citizen_reports_upvotes ON citizen_reports(upvotes);
CREATE INDEX idx_citizen_reports_location ON citizen_reports(location);

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_citizen_reports_updated_at 
BEFORE UPDATE ON citizen_reports 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE citizen_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for citizen_reports table
-- Anyone can view reports (public data)
CREATE POLICY "Citizen reports are viewable by everyone" 
ON citizen_reports FOR SELECT 
USING (true);

-- Only authenticated users can insert reports
CREATE POLICY "Authenticated users can insert reports" 
ON citizen_reports FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reports (but not verification fields)
CREATE POLICY "Users can update their own reports" 
ON citizen_reports FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  verified = OLD.verified AND 
  verified_by = OLD.verified_by AND 
  verified_at = OLD.verified_at
);

-- Users can delete their own reports
CREATE POLICY "Users can delete their own reports" 
ON citizen_reports FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create report votes tracking table
CREATE TABLE report_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES citizen_reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint to prevent duplicate votes
CREATE UNIQUE INDEX idx_report_votes_unique_user_report 
ON report_votes(report_id, user_id);

-- Add indexes
CREATE INDEX idx_report_votes_report_id ON report_votes(report_id);
CREATE INDEX idx_report_votes_user_id ON report_votes(user_id);

-- Enable RLS for report_votes
ALTER TABLE report_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for report_votes table
CREATE POLICY "Report votes are viewable by everyone" 
ON report_votes FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert votes" 
ON report_votes FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" 
ON report_votes FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" 
ON report_votes FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Function to update vote counts when votes are added/updated/deleted
CREATE OR REPLACE FUNCTION update_report_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE citizen_reports 
      SET upvotes = upvotes + 1 
      WHERE id = NEW.report_id;
    ELSE
      UPDATE citizen_reports 
      SET downvotes = downvotes + 1 
      WHERE id = NEW.report_id;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Remove old vote
    IF OLD.vote_type = 'up' THEN
      UPDATE citizen_reports 
      SET upvotes = upvotes - 1 
      WHERE id = OLD.report_id;
    ELSE
      UPDATE citizen_reports 
      SET downvotes = downvotes - 1 
      WHERE id = OLD.report_id;
    END IF;
    
    -- Add new vote
    IF NEW.vote_type = 'up' THEN
      UPDATE citizen_reports 
      SET upvotes = upvotes + 1 
      WHERE id = NEW.report_id;
    ELSE
      UPDATE citizen_reports 
      SET downvotes = downvotes + 1 
      WHERE id = NEW.report_id;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE citizen_reports 
      SET upvotes = upvotes - 1 
      WHERE id = OLD.report_id;
    ELSE
      UPDATE citizen_reports 
      SET downvotes = downvotes - 1 
      WHERE id = OLD.report_id;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ language plpgsql;

-- Create triggers for vote count updates
CREATE TRIGGER update_report_votes_count_insert
AFTER INSERT ON report_votes
FOR EACH ROW
EXECUTE FUNCTION update_report_vote_counts();

CREATE TRIGGER update_report_votes_count_update
AFTER UPDATE ON report_votes
FOR EACH ROW
EXECUTE FUNCTION update_report_vote_counts();

CREATE TRIGGER update_report_votes_count_delete
AFTER DELETE ON report_votes
FOR EACH ROW
EXECUTE FUNCTION update_report_vote_counts();