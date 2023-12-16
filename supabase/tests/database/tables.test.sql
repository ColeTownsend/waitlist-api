begin;

select
  plan (10);

set LOCAL search_path = core, PUBLIC, extensions;

select
  has_table ('organizations');

select
  has_table ('memberships');

select
  has_table ('users');

select
  has_table ('subscriptions');

select
  has_table ('organizations_subscriptions');

select
  has_table ('waitlists');

select
  has_table ('waitlist_settings');

select
  has_table ('waitlist_referrals');

select
  has_table ('waitlist_signups');

select check_test(tests.rls_enabled('public', 'organizations'), true);
select check_test(tests.rls_enabled('public', 'memberships'), true);
select check_test(tests.rls_enabled('public', 'users'), true);
select check_test(tests.rls_enabled('public', 'subscriptions'), true);
select check_test(tests.rls_enabled('public', 'organizations_subscriptions'), true);
select check_test(tests.rls_enabled('public', 'waitlists'), true);
select check_test(tests.rls_enabled('public', 'waitlist_settings'), true)
select check_test(tests.rls_enabled('public', 'waitlist_referrals'), true)
select check_test(tests.rls_enabled('public', 'waitlist_signups'), true)

select
  *
from
  finish ();

rollback;

