-- ============================================================
-- ระบบล็อกอินเจ้าหน้าที่ — รันไฟล์นี้ใน Supabase SQL Editor
-- (ถ้าใช้ Supabase CLI: supabase db push)
-- ============================================================

-- 1) ตารางเจ้าหน้าที่ ผูก 1:1 กับ auth.users
create table if not exists public.officers (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null unique,
  full_name     text not null default '',
  position      text not null default '',
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);
alter table public.officers enable row level security;

-- helper: เป็นเจ้าหน้าที่ที่ยังใช้งานอยู่ไหม
-- security definer เพื่อเลี่ยง RLS recursion บนตาราง officers เอง
create or replace function public.is_active_officer()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.officers where id = auth.uid() and active);
$$;
revoke all on function public.is_active_officer() from public, anon;
grant execute on function public.is_active_officer() to authenticated;

drop policy if exists officers_read on public.officers;
create policy officers_read on public.officers
  for select to authenticated using (public.is_active_officer());

drop policy if exists officers_update_self on public.officers;
create policy officers_update_self on public.officers
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and active = true);

-- 2) ประวัติการใช้งาน (append-only, เขียนผ่าน service role)
create table if not exists public.audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.officers(id) on delete set null,
  actor_email text not null default '',
  action      text not null,
  target_type text not null default '',
  target_id   text not null default '',
  detail      jsonb not null default '{}'::jsonb,
  ip          text not null default '',
  user_agent  text not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_actor_idx   on public.audit_logs (actor_id, created_at desc);
create index if not exists audit_logs_action_idx  on public.audit_logs (action, created_at desc);
alter table public.audit_logs enable row level security;

drop policy if exists audit_logs_read on public.audit_logs;
create policy audit_logs_read on public.audit_logs
  for select to authenticated using (public.is_active_officer());

-- 3) นับความพยายามล็อกอิน (ตั้งใจไม่มี policy = service role เท่านั้น)
create table if not exists public.login_attempts (
  id         bigint generated always as identity primary key,
  email      text not null,
  ip         text not null default '',
  ok         boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists login_attempts_email_idx on public.login_attempts (lower(email), created_at desc);
create index if not exists login_attempts_ip_idx    on public.login_attempts (ip, created_at desc);
alter table public.login_attempts enable row level security;

-- 4) รัดกุม policy เดิม: เดิมเปิดให้ authenticated ทุกคน -> เฉพาะเจ้าหน้าที่ที่ active
drop policy if exists permits_staff_read on public.permits;
create policy permits_staff_read on public.permits
  for select to authenticated using (public.is_active_officer());

drop policy if exists permits_staff_update on public.permits;
create policy permits_staff_update on public.permits
  for update to authenticated
  using (public.is_active_officer()) with check (public.is_active_officer());

drop policy if exists drone_reports_staff_read on public.drone_reports;
create policy drone_reports_staff_read on public.drone_reports
  for select to authenticated using (public.is_active_officer());

drop policy if exists drone_reports_staff_update on public.drone_reports;
create policy drone_reports_staff_update on public.drone_reports
  for update to authenticated
  using (public.is_active_officer()) with check (public.is_active_officer());

-- 5) สร้าง "เจ้าหน้าที่คนแรก" — แก้ปัญหาไก่กับไข่
--    หลังจากมีคนแรกแล้ว ให้เพิ่มคนอื่นผ่านหน้า /admin/users ซึ่งมี audit log ครบ
create or replace function public.bootstrap_officer(
  p_email text, p_password text, p_full_name text default '', p_position text default ''
)
returns uuid language plpgsql security definer
set search_path = public, auth, extensions as $$
declare
  v_id    uuid := gen_random_uuid();
  v_email text := lower(trim(p_email));
begin
  if length(p_password) < 12 then
    raise exception 'รหัสผ่านต้องยาวอย่างน้อย 12 ตัวอักษร';
  end if;
  if exists (select 1 from auth.users where email = v_email) then
    raise exception 'อีเมล % มีบัญชีอยู่แล้ว', v_email;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    v_email, extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_full_name), false
  );

  -- GoTrue ต้องมีแถวใน identities ด้วย; คอลัมน์ email เป็น generated จึงไม่ต้องใส่
  insert into auth.identities (
    provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    v_id::text, v_id,
    jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
    'email', now(), now(), now()
  );

  insert into public.officers (id, email, full_name, position, active)
  values (v_id, v_email, coalesce(p_full_name,''), coalesce(p_position,''), true);

  return v_id;
end;
$$;
revoke all on function public.bootstrap_officer(text, text, text, text) from public, anon, authenticated;

comment on table public.login_attempts is
  'เปิด RLS โดยไม่มี policy โดยตั้งใจ — เข้าถึงได้เฉพาะ service role เพื่อทำ rate limit การล็อกอิน';
comment on table public.audit_logs is
  'ประวัติการใช้งานแบบ append-only — เจ้าหน้าที่อ่านได้ เขียนได้เฉพาะ service role';
