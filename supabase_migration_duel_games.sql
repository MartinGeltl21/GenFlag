-- Tabelle für 1v1 Duell-Spiele
-- Führe dieses SQL im Supabase Dashboard unter SQL Editor aus

CREATE TABLE duel_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Spieler-Daten (NULL = Gast)
  player1_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  player1_name TEXT NOT NULL,
  player1_lives INT DEFAULT 3,
  player1_answered BOOLEAN DEFAULT FALSE,
  player1_correct BOOLEAN DEFAULT FALSE,
  player1_connected BOOLEAN DEFAULT TRUE,
  
  player2_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  player2_name TEXT,
  player2_lives INT DEFAULT 3,
  player2_answered BOOLEAN DEFAULT FALSE,
  player2_correct BOOLEAN DEFAULT FALSE,
  player2_connected BOOLEAN DEFAULT TRUE,
  
  -- Spielstatus
  current_flag_code TEXT,  -- Der aktuell angezeigte Ländercode (cca2)
  round_number INT DEFAULT 0,
  round_start_time TIMESTAMPTZ,
  
  status TEXT DEFAULT 'waiting',  -- waiting, active, finished
  winner TEXT,  -- 'player1', 'player2', NULL (bei Abbruch/Unentschieden)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für schnelles Lookup
CREATE INDEX idx_duel_games_status ON duel_games(status);
CREATE INDEX idx_duel_games_created_at ON duel_games(created_at);

-- RLS (Row Level Security) Policies
ALTER TABLE duel_games ENABLE ROW LEVEL SECURITY;

-- Jeder kann Spiele lesen (für Einladungslinks)
CREATE POLICY "Anyone can view games" ON duel_games
  FOR SELECT USING (true);

-- Jeder kann Spiele erstellen
CREATE POLICY "Anyone can create games" ON duel_games
  FOR INSERT WITH CHECK (true);

-- Spieler können Spiele aktualisieren
CREATE POLICY "Anyone can update games" ON duel_games
  FOR UPDATE USING (true);

-- Enable Realtime für diese Tabelle
ALTER PUBLICATION supabase_realtime ADD TABLE duel_games;
