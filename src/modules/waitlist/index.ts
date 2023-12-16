import { Elysia, t } from "elysia";

import { authen, supabase } from "../../libs";

export const waitlist = (app: Elysia) =>
  app.group("/waitlist", (app) =>
    app
      .get(
        "/:id",
        async ({ params: { id } }) => {
          const { data, error } = await supabase
            .from("waitlists")
            .select("name, description, waitlist_signups(count), waitlist_referrals(count)")
            .eq("id", id)
            .limit(1)
            .maybeSingle();

          if (error) {
            return error;
          }

          return {
            success: !!data,
            data: data ?? null,
          };
        },
        {
          detail: {
            description: "Retrieve waitlist by id",
          },
        },
      )
      .post(
        "/:id/join",
        async ({ params: { id }, body }) => {
          // get waitlist
          // @todo – ideally can have this org id already...
          const { data, error } = await supabase
            .from("waitlists")
            .select("organization_id")
            .eq("id", id)
            .limit(1)
            .maybeSingle();

          if (error) {
            return error;
          }

          // Find user by referral code

          // Create new waitlist_signup
          const { data: newSignup, error: signupError } = await supabase
            .rpc("create_waitlist_signup", {
              p_waitlist_id: id,
              p_email: body.email,
              p_referral_code: body.referral_code || undefined,
            })
            .select()
            .limit(1)
            .maybeSingle();

          if (signupError) {
            console.error(signupError);
            throw signupError;
          }

          return newSignup;
        },
        {
          body: t.Object({
            email: t.String({
              format: "email",
            }),
            referral_code: t.Optional(t.String()),
          }),
          detail: {
            tags: ["Authorized"],
            description: "Create a waitlist",
          },
        },
      ),
  );
