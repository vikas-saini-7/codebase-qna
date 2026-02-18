// SQL: Supabase function to cleanup QnA history (keep last 10)
// Place in your Supabase SQL editor
/*
create or replace function cleanup_qna_history(repo_id uuid)
returns void as $$
begin
  delete from qna_history
  where id not in (
    select id from qna_history
    where repository_id = repo_id
    order by created_at desc
    limit 10
  )
  and repository_id = repo_id;
end;
$$ language plpgsql;
*/
