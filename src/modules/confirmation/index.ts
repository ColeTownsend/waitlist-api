import { Elysia, t } from "elysia";

import { supabase } from "../../libs";

import { httpErrorDecorator } from "../../plugins/httpError";

export const waitlist = (app: Elysia) =>
  app.use(httpErrorDecorator).get(
    "/waitlist/:id/confirmation",
    async ({ params: { id }, query: { token }, HttpError }) => {
      const { data: waitlist, error: waitlistError } = await supabase
        .from("waitlists")
        .select("name, description, waitlist_signups(count), waitlist_referrals(count)")
        .eq("id", id)
        .limit(1)
        .maybeSingle();

      if (waitlistError) {
        throw HttpError.BadRequest(waitlistError.message);
      }
      if (!waitlist) {
        throw HttpError.NotFound("No waitlist found");
      }

      // confirm user
      const { data, error } = await supabase
        .rpc("confirm_user_referral_with_token", {
          p_token: token,
          p_waitlist_id: id,
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error(error);
        throw HttpError.Internal(error.message);
      }

      return {
        success: !!data,
        data: data ?? null,
      };
    },
    {
      query: t.Object({
        token: t.String(),
      }),
      detail: {
        description: "Retrieve waitlist by id",
      },
    },
  );
