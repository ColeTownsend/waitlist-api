begin;

select
  no_plan ();

select
  tests.create_supabase_user ('user');

select
  tests.create_supabase_user ('user-2');

select
  tests.authenticate_as ('user');

select
  lives_ok ($$
    select
      create_new_organization ('Supabase', tests.get_supabase_uid ('user'));

$$,
'can kickstart the creation of an organization and user');


select
  (lives_ok ($$ insert into waitlists (name, description, organization_id)
        values ('Waitlist 1', 'Description for Waitlist 1', tests.get_organization_id ('Supabase'));

$$,
'can insert a waitlist as an admin'));

select
  (lives_ok ($$ insert into waitlist_settings (organization_id, waitlist_id, settings)
        values (tests.get_organization_id ('Supabase'), '1', '{
    "points_per_confirmed_referral": 1,
    "confirmation_settings": {
       "automatic": false,
       "enable_confirmation_email": false
       "custom_redirect_url": null,
    },
    "notification_settings": {
      "email": true
    },
    "email_sender": {
      "reply_to": null,
      "logo": null,
      "sender_email": null,
      "sender_name": null
    },
    "user_emails": {
      "new_signup": false,
      "referral_confirmation": true,
      "access_granted": true
    }
  }'); $$, 'can insert waitlist settings as an admin'));

select
  tests.authenticate_as ('user');

select
  (throws_ok ($$ insert into waitlist_signups (email, points, waitlist_id)
    values ('user@example.com', 0, '1');

select
  (throws_ok ($$ insert into waitlist_signups (email, points, waitlist_id)
    values ('user2@example.com', 0, '2');

select
  (throws_ok ($$ insert into waitlist_referrals (referrer_user_id, referred_signup_id, waitlist_id)
    values (1, 2, 1);

select
  tests.authenticate_as ('user-2');

select
  is_empty ($$
    select
      * from waitlists
      where
        id = 12 $$, 'an user cannot read a waitlist it is not a member of');

select
  is_empty ($$
    select
      * from waitlist_referrals
      where
        id = 12 $$, 'an user cannot read a waitlist it is not a member of');

select
  is_empty ($$
    select
      * from waitlist_signups
      where
        id = 12 $$, 'an user cannot read a waitlist it is not a member of');

select
  is_empty ($$
    select
      * from waitlist_settings
      where
        id = 12 $$, 'an user cannot read a waitlist it is not a member of');

select
  tests.authenticate_as ('user');

select
  isnt_empty ($$
    select
      * from waitlist_signups
      where
        id = 1 $$, 'a user that is part of an org for a waitlist can see waitlist_signups');

select
  isnt_empty ($$
    select
      * from waitlist_referrals
      where
        id = 1 $$, 'a user that is part of an org for a waitlist can see waitlist_referrals');

set local role postgres;

select
  lives_ok ($$
    select
      tests.create_db_user (tests.get_supabase_uid ('user-2')) $$, 'can create a db user');

select
  lives_ok ($$ insert into memberships (organization_id, user_id, role)
      values (tests.get_organization_id('Supabase'), tests.get_supabase_uid ('user-2')
      , 0) $$, 'insert membership into new organization');

select
  throws_ok ($$ update
      memberships
    set
      role = 1
      where
        user_id = tests.get_supabase_uid ('user-1') $$);

select
  lives_ok ($$ update
      memberships
    set
      role = 1
      where
        user_id = tests.get_supabase_uid ('user-2') $$);

select
  isnt_empty ($$ delete from memberships
    where user_id = tests.get_supabase_uid ('user-2')
    returning
      id $$);

select
  *
from
  finish ();

rollback;