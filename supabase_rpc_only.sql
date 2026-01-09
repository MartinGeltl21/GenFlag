-- ============================================
-- ONLY RUN THIS PART TO UPDATE YOUR DB
-- ============================================

-- 8. Atomic Increment Function
-- This prevents race conditions when clicking fast. It handles insert OR update atomically.
create or replace function update_flag_stats(p_country_code text, p_is_correct boolean)
returns void as $$
declare
  v_user_id uuid;
begin
  -- Get current user ID consistently
  v_user_id := auth.uid();
  
  if v_user_id is null then
    return; -- Do nothing if not logged in
  end if;

  insert into public.flag_stats (user_id, country_code, times_correct, times_wrong)
  values (
    v_user_id, 
    p_country_code, 
    case when p_is_correct then 1 else 0 end,
    case when p_is_correct then 0 else 1 end
  )
  on conflict (user_id, country_code) do update set
    times_correct = flag_stats.times_correct + excluded.times_correct,
    times_wrong = flag_stats.times_wrong + excluded.times_wrong,
    last_played_at = now();
end;
$$ language plpgsql security definer;
