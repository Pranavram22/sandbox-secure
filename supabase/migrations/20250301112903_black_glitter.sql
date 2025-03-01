-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT
);

-- Create code_scans table
CREATE TABLE IF NOT EXISTS code_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  code_snippet TEXT NOT NULL,
  language TEXT NOT NULL,
  vulnerabilities JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending',
  repository_url TEXT,
  file_path TEXT
);

-- Create vulnerability_fixes table
CREATE TABLE IF NOT EXISTS vulnerability_fixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  scan_id UUID NOT NULL REFERENCES code_scans(id),
  vulnerability_index INTEGER NOT NULL,
  fix_code TEXT NOT NULL,
  applied BOOLEAN DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE vulnerability_fixes ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create policies for code_scans
CREATE POLICY "Users can view their own code scans"
  ON code_scans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own code scans"
  ON code_scans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own code scans"
  ON code_scans
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for vulnerability_fixes
CREATE POLICY "Users can view fixes for their scans"
  ON vulnerability_fixes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM code_scans
      WHERE code_scans.id = vulnerability_fixes.scan_id
      AND code_scans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert fixes for their scans"
  ON vulnerability_fixes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM code_scans
      WHERE code_scans.id = vulnerability_fixes.scan_id
      AND code_scans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update fixes for their scans"
  ON vulnerability_fixes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM code_scans
      WHERE code_scans.id = vulnerability_fixes.scan_id
      AND code_scans.user_id = auth.uid()
    )
  );