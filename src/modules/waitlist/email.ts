import { Elysia, t } from "elysia";

import { supabase } from "../../libs";
import { httpErrorDecorator } from "@plugins/httpError";
export const waitlist_email = (app: Elysia) =>
  app.group("/waitlist/:id", (app) =>
    app
      .use(httpErrorDecorator)
      .get(
        "/email",
        async ({ params: { id }, query: { email }, HttpError }) => {
          const { data, error } = await supabase
            .from("waitlist_signups")
            .select("*")
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
            description: "Retrieve email from waitlist",
          },
        },
      )
      .delete(
        "/email",
        async ({ params: { id }, query: { email }, HttpError }) => {
          const { data, error } = await supabase
            .from("waitlist_signups")
            .delete()
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
            description: "Remove email from waitlist",
          },
        },
      ),
  );
