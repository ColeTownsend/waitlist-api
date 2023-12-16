import { Elysia, t } from "elysia";

import { authen, supabase } from "../../libs";
import { httpErrorDecorator } from "../../plugins/httpError";

export const waitlist = (app: Elysia) =>
  app.group("/waitlist", (app) =>
    app
      .use(httpErrorDecorator)
      .get(
        "/:id",
        async ({ params: { id }, HttpError }) => {
          const { data, error } = await supabase
            .from("waitlists")
            .select("name, description, waitlist_signups(count), waitlist_referrals(count)")
            .eq("id", id)
            .limit(1)
            .maybeSingle();

          if (error) {
            throw HttpError.BadRequest(error.message);
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
        async ({ params: { id }, body, HttpError }) => {
          // get waitlist
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
            throw HttpError.Internal(signupError.message);
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
      )
      .get(
        "/:id/confirm",
        async ({ params: { id }, query: { email }, HttpError }) => {
          // confirm user
          const { data, error } = await supabase
            .rpc("confirm_user_referral", {
              p_email: email,
              p_waitlist_id: id,
            })
            .select()
            .maybeSingle();

          if (error) {
            console.error(error);
            throw HttpError.Internal(error.message);
          }

          return {
            success: !error,
          };
        },
        {
          query: t.Object({
            email: t.String({
              format: "email",
            }),
          }),
          detail: {
            tags: ["Authorized"],
            description: "Create a waitlist",
          },
        },
      ),
  );
