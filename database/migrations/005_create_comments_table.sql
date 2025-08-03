-- Create comments table
-- This table stores user comments on promises with threading support

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promise_id TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0 CHECK (upvotes >= 0),
  downvotes INTEGER DEFAULT 0 CHECK (downvotes >= 0),
  is_pinned BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_comments_promise_id ON comments(promise_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);
CREATE INDEX idx_comments_upvotes ON comments(upvotes);
CREATE INDEX idx_comments_is_pinned ON comments(is_pinned);
CREATE INDEX idx_comments_is_deleted ON comments(is_deleted);

-- Create index for threaded comments queries
CREATE INDEX idx_comments_promise_parent ON comments(promise_id, parent_comment_id);

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_comments_updated_at 
BEFORE UPDATE ON comments 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments table
-- Anyone can view non-deleted comments
CREATE POLICY "Non-deleted comments are viewable by everyone" 
ON comments FOR SELECT 
USING (is_deleted = FALSE);

-- Only authenticated users can insert comments
CREATE POLICY "Authenticated users can insert comments" 
ON comments FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments (content only, not votes or pins)
CREATE POLICY "Users can update their own comments" 
ON comments FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  upvotes = OLD.upvotes AND 
  downvotes = OLD.downvotes AND 
  is_pinned = OLD.is_pinned
);

-- Users can soft delete their own comments
CREATE POLICY "Users can delete their own comments" 
ON comments FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND is_deleted = TRUE);

-- Create comment votes tracking table
CREATE TABLE comment_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint to prevent duplicate votes
CREATE UNIQUE INDEX idx_comment_votes_unique_user_comment 
ON comment_votes(comment_id, user_id);

-- Add indexes
CREATE INDEX idx_comment_votes_comment_id ON comment_votes(comment_id);
CREATE INDEX idx_comment_votes_user_id ON comment_votes(user_id);

-- Enable RLS for comment_votes
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment_votes table
CREATE POLICY "Comment votes are viewable by everyone" 
ON comment_votes FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert comment votes" 
ON comment_votes FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comment votes" 
ON comment_votes FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment votes" 
ON comment_votes FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Function to update vote counts when votes are added/updated/deleted
CREATE OR REPLACE FUNCTION update_comment_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE comments 
      SET upvotes = upvotes + 1 
      WHERE id = NEW.comment_id;
    ELSE
      UPDATE comments 
      SET downvotes = downvotes + 1 
      WHERE id = NEW.comment_id;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Remove old vote
    IF OLD.vote_type = 'up' THEN
      UPDATE comments 
      SET upvotes = upvotes - 1 
      WHERE id = OLD.comment_id;
    ELSE
      UPDATE comments 
      SET downvotes = downvotes - 1 
      WHERE id = OLD.comment_id;
    END IF;
    
    -- Add new vote
    IF NEW.vote_type = 'up' THEN
      UPDATE comments 
      SET upvotes = upvotes + 1 
      WHERE id = NEW.comment_id;
    ELSE
      UPDATE comments 
      SET downvotes = downvotes + 1 
      WHERE id = NEW.comment_id;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE comments 
      SET upvotes = upvotes - 1 
      WHERE id = OLD.comment_id;
    ELSE
      UPDATE comments 
      SET downvotes = downvotes - 1 
      WHERE id = OLD.comment_id;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ language plpgsql;

-- Create triggers for vote count updates
CREATE TRIGGER update_comment_votes_count_insert
AFTER INSERT ON comment_votes
FOR EACH ROW
EXECUTE FUNCTION update_comment_vote_counts();

CREATE TRIGGER update_comment_votes_count_update
AFTER UPDATE ON comment_votes
FOR EACH ROW
EXECUTE FUNCTION update_comment_vote_counts();

CREATE TRIGGER update_comment_votes_count_delete
AFTER DELETE ON comment_votes
FOR EACH ROW
EXECUTE FUNCTION update_comment_vote_counts();

-- Function to get threaded comments for a promise
CREATE OR REPLACE FUNCTION get_promise_comments(p_promise_id TEXT)
RETURNS TABLE(
  id UUID,
  promise_id TEXT,
  user_id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  parent_comment_id UUID,
  content TEXT,
  upvotes INTEGER,
  downvotes INTEGER,
  is_pinned BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  reply_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE comment_tree AS (
    -- Root comments (no parent)
    SELECT 
      c.id,
      c.promise_id,
      c.user_id,
      p.username,
      p.full_name,
      p.avatar_url,
      c.parent_comment_id,
      c.content,
      c.upvotes,
      c.downvotes,
      c.is_pinned,
      c.created_at,
      0::BIGINT as depth
    FROM comments c
    LEFT JOIN profiles p ON c.user_id = p.id
    WHERE c.promise_id = p_promise_id 
    AND c.parent_comment_id IS NULL 
    AND c.is_deleted = FALSE
    
    UNION ALL
    
    -- Child comments
    SELECT 
      c.id,
      c.promise_id,
      c.user_id,
      p.username,
      p.full_name,
      p.avatar_url,
      c.parent_comment_id,
      c.content,
      c.upvotes,
      c.downvotes,
      c.is_pinned,
      c.created_at,
      ct.depth + 1
    FROM comments c
    LEFT JOIN profiles p ON c.user_id = p.id
    INNER JOIN comment_tree ct ON c.parent_comment_id = ct.id
    WHERE c.is_deleted = FALSE
  )
  SELECT 
    ct.id,
    ct.promise_id,
    ct.user_id,
    ct.username,
    ct.full_name,
    ct.avatar_url,
    ct.parent_comment_id,
    ct.content,
    ct.upvotes,
    ct.downvotes,
    ct.is_pinned,
    ct.created_at,
    (
      SELECT COUNT(*)
      FROM comments c2 
      WHERE c2.parent_comment_id = ct.id 
      AND c2.is_deleted = FALSE
    ) as reply_count
  FROM comment_tree ct
  ORDER BY ct.is_pinned DESC, ct.created_at ASC;
END;
$$ language plpgsql;