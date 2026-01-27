-- Copy this SQL into the Supabase SQL Editor
-- Game Progress Migration

-- 1. Create table to store game progress
create table if not exists game_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  game_mode text not null,  -- 'classic', 'expert', 'survival', 'regions'
  state jsonb not null,     -- Game state as JSON
  updated_at timestamptz default now(),
  
  -- One progress entry per user per game mode
  unique(user_id, game_mode)
);

-- 2. Enable Row Level Security
alter table game_progress enable row level security;

-- 3. Create policies
create policy "Users can read own progress"
  on game_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on game_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on game_progress for update
  using (auth.uid() = user_id);

create policy "Users can delete own progress"
  on game_progress for delete
  using (auth.uid() = user_id);

-- 4. Create index for faster lookups
create index if not exists idx_game_progress_user_mode 
  on game_progress(user_id, game_mode);
