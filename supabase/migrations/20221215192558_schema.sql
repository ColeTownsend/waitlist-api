create type subscription_status as ENUM (
  'active',
  'trialing',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete',
  'incomplete_expired',
  'paused'
);

create table users (
  id uuid references auth.users not null primary key,
  photo_url text,
  display_name text,
  onboarded bool not null,
  created_at timestamptz not null default now()
);

create table subscriptions (
  id text not null primary key,
  price_id text not null,
  status subscription_status not null,
  cancel_at_period_end bool not null,
  currency text,
  interval text,
  interval_count int,
  created_at timestamptz,
  period_starts_at timestamptz,
  period_ends_at timestamptz,
  trial_starts_at timestamptz,
  trial_ends_at timestamptz
);

create table organizations (
  id bigint generated always as identity primary key,
  name text not null,
  logo_url text,
  created_at timestamptz not null default now()
);

create table organizations_subscriptions (
  organization_id bigint not null references public.organizations (id) on delete cascade,
  subscription_id text unique references public.subscriptions (id) on delete set null,
  customer_id text not null unique,
  primary key (organization_id)
);

create table memberships (
  id bigint generated always as identity primary key,
  user_id uuid references public.users,
  organization_id bigint not null references public.organizations,
  role int not null,
  invited_email text,
  code text,
  created_at timestamptz not null default now(),
  unique (user_id, organization_id)
);

CREATE TABLE waitlists (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique identifier for each waitlist
  name text NOT NULL,                            -- Name of the waitlist
  description text,                              -- Description of the waitlist
  organization_id bigint not null references public.organizations (id) on delete cascade,
  created_at timestamptz NOT NULL DEFAULT now()  -- Timestamp of waitlist creation
);

-- Create api token to access waitlist api side
CREATE TABLE api_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique identifier for each token
  token UUID not null default uuid_generate_v4(),
  description text,                              -- Description of the token
  organization_id bigint not null references public.organizations (id) on delete cascade,
  created_at timestamptz NOT NULL DEFAULT now()  -- Timestamp of waitlist creation
);

-- Create waitlist settings
CREATE TABLE waitlist_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), -- Unique identifier for each waitlist
  organization_id bigint not null references public.organizations (id) on delete cascade,
  waitlist_id uuid NOT NULL REFERENCES waitlists(id) on delete cascade,
  settings JSONB NOT NULL DEFAULT '{
    "points_per_confirmed_referral": 1,
    "confirmation_settings": {
       "automatic": false,
       "enable_confirmation_email": false
    },
    "notification_settings": {
      "email": true
    }
  }'::jsonb
);

-- Make waitlist users table
CREATE TABLE waitlist_signups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL,
  points int NOT NULL DEFAULT 0,
  unique_share_code text not null DEFAULT random_alphanumeric_string(8)
  organization_id bigint not null references public.organizations (id) on delete cascade,
  waitlist_id uuid NOT NULL REFERENCES waitlists(id) on delete cascade,
  joined_at timestamptz NOT NULL DEFAULT now(),
  confirmed boolean NOT NULL DEFAULT false, -- Boolean field to track confirmation
  confirmation_token text, -- Optional: Token used for email confirmation
  confirmed_at timestamptz, -- Timestamp for when the signup is confirmed
  UNIQUE (email, waitlist_id)
  UNIQUE (unique_share_code, waitlist_id)
);

-- Track what users were referred
CREATE TABLE waitlist_referrals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_user_id uuid NOT NULL REFERENCES users(id) on delete set null, -- The user who made the referral
  referred_signup_id uuid REFERENCES waitlist_signups(id) on delete cascade, -- The waitlist signup that was referred
  organization_id bigint not null references public.organizations (id) on delete cascade,
  waitlist_id uuid NOT NULL REFERENCES waitlists(id) on delete cascade, -- The waitlist to which the referral pertains
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed boolean NOT NULL DEFAULT false, -- Boolean field to track if the referral is confirmed
  UNIQUE (referrer_user_id, referred_signup_id, waitlist_id)
);

insert into storage.buckets (id, name, PUBLIC)
  values ('logos', 'logos', true);

insert into storage.buckets (id, name, PUBLIC)
  values ('avatars', 'avatars', true);

alter table organizations enable row level security;

alter table users enable row level security;

alter table memberships enable row level security;

alter table subscriptions enable row level security;

ALTER TABLE waitlists ENABLE ROW LEVEL SECURITY;

ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY;

ALTER TABLE waitlist_referrals ENABLE ROW LEVEL SECURITY;

ALTER TABLE waitlist_settings ENABLE ROW LEVEL SECURITY;

alter table organizations_subscriptions enable row level security;

alter table api_tokens enable row level security;

create or replace function create_new_organization (org_name text, user_id uuid, create_user bool default true)
  returns bigint
  language PLPGSQL
  security definer
  as $$
declare
  organization bigint;
begin
  insert into organizations ("name")
    values (org_name)
  returning
    id into organization;
  if create_user then
    insert into users (id, onboarded)
      values (user_id, true);
  end if;
  insert into memberships (user_id, organization_id, role)
    values (user_id, organization, 2);
  return organization;
end;
$$;

CREATE OR REPLACE FUNCTION create_new_waitlist(waitlist_name text, org_id bigint)
RETURNS uuid
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
    new_waitlist uuid;
BEGIN
    -- Insert into waitlists table and return the new id
    INSERT INTO waitlists (name, organization_id)
    VALUES (waitlist_name, org_id)
    RETURNING id INTO new_waitlist; -- Correct use of RETURNING clause

    -- Insert into waitlist_settings table
    INSERT INTO waitlist_settings (waitlist_id, organization_id)
    VALUES (new_waitlist, org_id);

    -- Return the new waitlist id
    RETURN new_waitlist;
END;
$$;


create or replace function accept_invite_to_organization (invite_code text, invite_user_id uuid)
  returns json
  language PLPGSQL
  security definer
  as $$
declare
  organization bigint;
  membership bigint;
begin
  if not exists(select 1 from users where id = invite_user_id) then
    insert into users (id, onboarded)
      values (invite_user_id, true);
  end if;

  update
    memberships
  set
    user_id = invite_user_id,
    code = null,
    invited_email = null
  where
    code = invite_code
  returning
    id,
    organization_id into membership,
    organization;
  return json_build_object('organization', organization, 'membership', membership);
end;
$$;

create or replace function get_organizations_for_authenticated_user ()
  returns setof bigint
  language SQL
  security definer
  set search_path = PUBLIC stable
  as $$
  select
    organization_id
  from
    memberships
  where
    user_id = auth.uid ()
$$;

create or replace function get_role_for_authenticated_user (org_id bigint)
  returns int
  language PLPGSQL
  as $$
declare
  current_user_role int;
begin
  select
    role
  from
    memberships
  where
    user_id = auth.uid ()
    and memberships.organization_id = org_id into current_user_role;
  return current_user_role;
end;
$$;

create or replace function get_role_for_user (membership_id bigint)
  returns int
  language PLPGSQL
  as $$
declare
  current_user_role int;
begin
  select
    role
  from
    memberships
  where
    id = membership_id
  limit 1 into current_user_role;
  return current_user_role;
end;
$$;

create or replace function current_user_is_member_of_organization (organization_id bigint)
  returns bool
  language PLPGSQL
  as $$
begin
  return (organization_id in (
      select
        get_organizations_for_authenticated_user ()));
end;
$$;

create or replace function can_update_user_role (organization_id bigint, membership_id bigint)
  returns bool
  language PLPGSQL
  as $$
declare
  current_user_role int;
begin
  select
    get_role_for_authenticated_user (organization_id) into current_user_role;
  return current_user_role > get_role_for_user (membership_id);
end;
$$;

create or replace function can_roll_api_token (organization_id bigint)
  returns bool
  language PLPGSQL
  as $$
declare
  current_user_role int;
begin
  select
    get_role_for_authenticated_user (organization_id) into current_user_role;
  return current_user_role > 1;
end;
$$;

create or replace function transfer_organization (org_id bigint, target_user_membership_id bigint)
  returns void
  security definer
  language PLPGSQL
  as $$
declare
  current_user_role int;
  current_user_membership_id int;
begin
  select id, role from memberships where user_id = auth.uid() into current_user_membership_id, current_user_role;

  if current_user_role != 2 then
    raise exception 'Only owners can transfer organizations';
  end if;

  if current_user_membership_id = target_user_membership_id then
    raise exception 'Cannot transfer organization to yourself';
  end if;

  update
    memberships
  set
    role = 2
  where
    id = target_user_membership_id;
  update
    memberships
  set
    role = 1
  where
    user_id = auth.uid ()
    and organization_id = org_id;
end;
$$;

create policy "Users can update data to only their records" on users
  for update
    using (auth.uid () = users.id)
    with check (auth.uid () = users.id);

CREATE POLICY "Waitlists can only be read by members that belong to the
  organization" on waitlists
  for select
    using (current_user_is_member_of_organization (organization_id));

create policy "Waitlist Signups can only be read by members that belong to the
  organization" on waitlist_signups
  for select
    using (current_user_is_member_of_organization (organization_id));

create policy "Waitlist Referrlas can only be read by members that belong to the
  organization" on waitlist_referrals
  for select
    using (current_user_is_member_of_organization (organization_id));

create policy "Waitlist Referrals can only be read by members that belong to the
  organization" on waitlist_settings
  for select
    using (current_user_is_member_of_organization (organization_id));

create policy "Users can read the public data of users belonging to the same
  organization" on users
  for select
    using (exists (
      select
        1
      from
        memberships
      where
        organization_id in (
          select
            get_organizations_for_authenticated_user ())));

create policy "Organizations can only be selectable by the members of the
  organization" on organizations
  for select
    using (id in (
      select
        organization_id
      from
        memberships
      where
        auth.uid () = memberships.user_id));

create policy "Organizations can only be updated by the members of the
  organization" on organizations
  for update
    using (id in (
      select
        organization_id
      from
        memberships
      where
        auth.uid () = memberships.user_id))
      with check (id in (
        select
          organization_id
        from
          memberships
        where
          auth.uid () = memberships.user_id));

create policy "Memberships can only be read by members that belong to the
  organization" on memberships
  for select
    using (current_user_is_member_of_organization (organization_id));

create policy "API Tokens can only be read by members that belong to the
  organization" on api_tokens
  for select
    using (current_user_is_member_of_organization (organization_id));

create policy "API Tokens can only be updated by members that belong to the
  organization" on api_tokens
  for update
    using (can_roll_api_token(organization_id));

create policy "Pending memberships can be read by members assigned to one" on memberships
  for select
    using (
        auth.email() = memberships.invited_email
        and memberships.code is not null
    );

create policy "Organizations can be read by invited members to that organization" on organizations
  for select
    using (
        exists (
            select 1 from memberships
            where organizations.id = memberships.organization_id
            and memberships.invited_email = auth.email()
            and memberships.code is not null
        )
    );

create policy "Memberships can be created by members that belong to the
  organization" on memberships
  for insert
    with check (current_user_is_member_of_organization (organization_id));

create policy "Memberships can only be updated if the user's role who updates
  the role is greater" on memberships
  for update
    using (can_update_user_role (organization_id, id));

create policy "Memberships can only be deleted if the user's role who updates
  the role is greater" on memberships
  for delete
    using (can_update_user_role (organization_id, id));

-- Waitlist CUD
create policy "Waitlists can be created by members that belong to the
  organization" on waitlists
  for insert
    with check (current_user_is_member_of_organization (organization_id));

create policy "Waitlists can only be updated if the user's role who updates
  the role is greater" on waitlists
  for update
    with check (current_user_is_member_of_organization (organization_id));

create policy "Waitlists can only be deleted if the user's role who updates
  the role is greater" on waitlists
  for delete
    using (current_user_is_member_of_organization (organization_id));

-- Waitlist Settings CUD
create policy "Waitlist settings can be updated by members that belong to the
  organization" on waitlist_settings
  for update
    with check (current_user_is_member_of_organization (organization_id));

-- Waitlist referrals CUD
create policy "Waitlist referrals can only be updated if the user's role who updates
  the role is greater" on waitlist_referrals
  for update
    with check (current_user_is_member_of_organization (organization_id));

create policy "Waitlist referrals can only be deleted if the user's role who updates
  the role is greater" on waitlist_referrals
  for delete
    using (current_user_is_member_of_organization (organization_id));

create policy "Subscriptions can only be selectable by members that belong to
  the organization" on subscriptions
  for select
    using (exists (
      select
        1
      from
        memberships
        join organizations_subscriptions on organizations_subscriptions.organization_id = memberships.organization_id
      where
        memberships.organization_id = organizations_subscriptions.organization_id and subscriptions.id = organizations_subscriptions.subscription_id and memberships.user_id = auth.uid ()));

create policy "Users can read subscriptions if they belong to the organization" on organizations_subscriptions
  for select
    using (exists (
      select
        1
      from
        memberships
      where
        user_id = auth.uid () and organization_id = memberships.organization_id));

create policy "Logos can be read and written by users that belong to the
  organization" on storage.objects
  for all
    using (bucket_id = 'logos'
      and (replace(storage.filename (name), concat('.', storage.extension (name)), '')::int) in (
        select
          get_organizations_for_authenticated_user ()))
        with check (bucket_id = 'logos'
        and (replace(storage.filename (name), concat('.', storage.extension (name)), '')::int) in (
          select
            get_organizations_for_authenticated_user ()));

create policy "Avatars can be read and written only by the user that owns the
  avatar" on storage.objects
  for all
    using (bucket_id = 'avatars'
      and (replace(storage.filename (name), concat('.', storage.extension (name)), '')::uuid) = auth.uid ())
      with check (bucket_id = 'avatars'
      and (replace(storage.filename (name), concat('.', storage.extension (name)), '')::uuid) = auth.uid ());

CREATE OR REPLACE FUNCTION random_alphanumeric_string(length int)
RETURNS text AS $$
DECLARE
  chars text[] := '{0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z}';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..length LOOP
    result := result || chars[1 + random() * array_length(chars, 1)];
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
