alter table "public"."organizations" add column "uuid" uuid not null default gen_random_uuid();

CREATE UNIQUE INDEX organizations_uuid_key ON public.organizations USING btree (uuid);

alter table "public"."organizations" add constraint "organizations_uuid_key" UNIQUE using index "organizations_uuid_key";

DROP FUNCTION public.create_new_organization;

CREATE OR REPLACE FUNCTION public.create_new_organization(org_name text, user_id uuid, create_user boolean DEFAULT true)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
  organization bigint;
  uid uuid;
  api_token uuid;
BEGIN
  INSERT INTO organizations ("name")
    VALUES (org_name)
  RETURNING
    id, uuid INTO organization, uid;
  IF create_user THEN
    INSERT INTO users (id, onboarded)
      VALUES (user_id, true);
  END IF;
  INSERT INTO memberships (user_id, organization_id, role)
    VALUES (user_id, organization, 2);
  INSERT INTO api_tokens (description, organization_id)
    VALUES ('API token for ' || org_name, organization)
  RETURNING
    token INTO api_token;
  RETURN uid;
END;
$$;
