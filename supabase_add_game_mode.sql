-- ============================================
-- ADD GAME MODE TO HIGHSCORES TABLE
-- ============================================
-- Run this migration to add game_mode support for both Survival and Expert modes

-- Add game_mode column with default 'survival' for existing entries
ALTER TABLE highscores 
ADD COLUMN IF NOT EXISTS game_mode TEXT NOT NULL DEFAULT 'survival';

-- Create index for better query performance when filtering by game_mode
CREATE INDEX IF NOT EXISTS highscores_game_mode_score_idx 
ON highscores(game_mode, score DESC);

-- Optional: Update the comment on the table
COMMENT ON COLUMN highscores.game_mode IS 'Game mode: survival or expert';
