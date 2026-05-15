-- Fix invite_code: char(8) causes space-padding bugs.
-- Change to varchar(8) and regenerate codes for any space-padded values.

begin;

-- 1. Change column type from char(8) to varchar(8)
alter table public.profiles
  alter column invite_code type varchar(8);

-- 2. Regenerate invite codes for profiles where the code has trailing spaces
--    (i.e. old 6-char codes that were space-padded by the char(8) type)
update public.profiles
set invite_code = upper(substring(md5(random()::text || id::text) from 1 for 8))
where invite_code is not null
  and length(trim(invite_code)) < 8;

commit;
