// Public Email Actions
import { Elysia, t } from "elysia";

import { supabase } from "../../../libs";
import { httpErrorDecorator } from "@plugins/httpError";

export const public_waitlist_email = (app: Elysia) =>
  app.group("/waitlist/:id", (app) =>
    app
      .use(httpErrorDecorator)
      // lookup user by email
      .get(
        "/email",
        async ({ params: { id }, query: { email }, HttpError }) => {
          const { data, error } = await supabase
            .from("waitlist_signups")
            .select("email,points,referral_count")
            .eq("email", email)
            .eq("waitlist_id", id)
            .limit(1)
            .maybeSingle();

          if (error) {
            throw HttpError.BadRequest(error.message);
          }
          if (!data) {
            throw HttpError.NotFound("No email found.");
          }

          return {
            success: !!data,
            data: data ?? null,
          };
        },
        {
          query: t.Object({
            email: t.String({
              type: "email",
            }),
          }),
          detail: {
            description: "Retrieve public email data from waitlist",
          },
        },
      ),
  );
