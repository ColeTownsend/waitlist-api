// Confirmation via token by users
import { Elysia, t } from "elysia";

import { supabase } from "@libs/supabase";

import { httpErrorDecorator } from "@plugins/httpError";

export const confirmation = (app: Elysia) =>
  app.use(httpErrorDecorator).get(
    "/waitlist/:id/confirmation",
    async ({ params: { id }, query: { token }, HttpError }) => {
      // confirm user
      const { error } = await supabase
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

      // @todo redirect user
      return {
        success: true,
        data: null,
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
