-- User Feedback Table
CREATE TABLE IF NOT EXISTS user_feedback (
  id SERIAL PRIMARY KEY,
  lan_id VARCHAR(50) NOT NULL,
  page_location VARCHAR(100),
  feedback TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved BOOLEAN DEFAULT FALSE
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_lan_id ON user_feedback(lan_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at); 