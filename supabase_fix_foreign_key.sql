-- ============================================
-- FIX FOREIGN KEY FOR HIGHSCORES
-- ============================================

-- This is necessary to allow fetching the username from the profiles table
-- via the highscores table.

alter table highscores
drop constraint if exists highscores_user_id_fkey;

alter table highscores
add constraint highscores_user_id_fkey
foreign key (user_id)
references profiles(id)
on delete cascade;
