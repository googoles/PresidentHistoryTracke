-- Drop existing tables
DROP TABLE IF EXISTS pledges CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;

-- Create Candidates table with correct schema matching SQLite
CREATE TABLE candidates (
    hubo_id BIGINT PRIMARY KEY,
    sg_id TEXT,
    name TEXT NOT NULL,
    party_name TEXT,
    sgg_name TEXT,
    gender TEXT,
    age INTEGER,
    job TEXT,
    edu TEXT,
    career1 TEXT,
    career2 TEXT,
    is_winner BOOLEAN DEFAULT false,
    votes_won INTEGER,
    vote_percentage REAL,
    metro_city TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Pledges table (matching SQLite schema exactly)
CREATE TABLE pledges (
    pledge_id INTEGER PRIMARY KEY,
    hubo_id BIGINT REFERENCES candidates(hubo_id) ON DELETE CASCADE,
    pledge_order INTEGER,
    pledge_realm VARCHAR(255),
    pledge_title VARCHAR(255) NOT NULL,
    pledge_content TEXT,
    status VARCHAR(20) DEFAULT '준비중',
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_candidates_metro_city ON candidates(metro_city);
CREATE INDEX idx_candidates_is_winner ON candidates(is_winner);
CREATE INDEX idx_candidates_party ON candidates(party_name);
CREATE INDEX idx_pledges_hubo_id ON pledges(hubo_id);
CREATE INDEX idx_pledges_status ON pledges(status);
CREATE INDEX idx_pledges_realm ON pledges(pledge_realm);

-- Full Text Search setup
ALTER TABLE candidates ADD COLUMN search_vector tsvector;
CREATE INDEX idx_candidates_search ON candidates USING GIN(search_vector);

-- Search vector update function
CREATE OR REPLACE FUNCTION candidates_search_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('simple', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.sgg_name, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.party_name, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER candidates_search_vector_update
    BEFORE INSERT OR UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION candidates_search_update();

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_candidates_updated_at
    BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pledges_updated_at
    BEFORE UPDATE ON pledges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pledges ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public candidates are viewable by everyone"
    ON candidates FOR SELECT
    USING (true);

CREATE POLICY "Public pledges are viewable by everyone"
    ON pledges FOR SELECT
    USING (true);

-- Grant permissions
GRANT SELECT ON candidates TO anon;
GRANT SELECT ON pledges TO anon;
GRANT SELECT ON candidates TO authenticated;
GRANT SELECT ON pledges TO authenticated;
