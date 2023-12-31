// Admin Waitlist Actions
import { Elysia, t } from "elysia";

import { authen, supabase } from "../../../libs";
import { httpErrorDecorator } from "@plugins/httpError";
import { Database } from "../../../database.types";

const SIZE = 50;

export const admin = (app: Elysia) =>
  app.group("/admin/waitlist", (app) =>
    app
      .use(authen)
      .use(httpErrorDecorator)
      .get(
        "/:id",
        async ({ params: { id }, HttpError }) => {
          const { data, error } = await supabase
            .from("waitlists")
            .select("*, waitlist_signups(count), waitlist_referrals(count)")
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
      .get(
        "/:id/emails",
        async ({ params: { id }, query: { page }, HttpError }) => {
          const limit = SIZE ? +SIZE : SIZE;
          const from = page ? (Number(page) - 1) * limit : 0;
          const to = page ? from + SIZE : SIZE;

          const { data, error } = await supabase
            .from("waitlist_signups")
            .select("id,email,points,joined_at,unique_share_code", { count: "exact" })
            .eq("waitlist_id", id)
            .range(from, to);

          if (error) {
            throw HttpError.BadRequest(error.message);
          }

          return {
            success: !!data,
            data: data ?? null,
          };
        },
        {
          query: t.Object({
            page: t.Optional(
              t.String({
                minimum: 1,
              }),
            ),
          }),
          detail: {
            description: "Retrieve waitlist emails",
          },
        },
      )
      .post(
        "/create",
        async ({ body, HttpError }) => {
          const { data, error } = await supabase
            .rpc("create_new_waitlist", {
              waitlist_name: body.name,
              org_id: body.org_id,
            })
            .select()
            .limit(1)
            .maybeSingle();

          if (error) {
            console.error(error);
            throw HttpError.BadRequest(error.message);
          }

          return data;
        },
        {
          body: t.Object({
            org_id: t.Number(),
            name: t.String(),
          }),
          detail: {
            tags: ["Authorized"],
            description: "Create a waitlist",
          },
        },
      )
      .put(
        "/:id",
        async ({ params: { id }, body, HttpError }) => {
          const { data, error } = await supabase
            .from("waitlists")
            .update(body)
            .eq("id", id)
            .select()
            .limit(1)
            .order("id", { ascending: false })
            .maybeSingle();

          if (error) {
            console.error(error);
            throw HttpError.BadRequest(error.message);
          }

          return {
            data,
            success: !!data,
          };
        },
        {
          body: t.Object({
            name: t.String(),
            description: t.String(),
          }),
          detail: {
            description: "Delete waitlist by id",
          },
        },
      )
      .delete(
        "/:id",
        async ({ params: { id }, HttpError }) => {
          const { error } = await supabase.from("waitlists").delete().eq("id", id);

          if (error) {
            throw HttpError.BadRequest(error.message);
          }

          return {
            success: !error,
          };
        },
        {
          detail: {
            description: "Delete waitlist by id",
          },
        },
      )
      .delete(
        "/:id/email",
        async ({ params: { id }, query: { email }, HttpError }) => {
          const { error } = await supabase
            .from("waitlist_signups")
            .delete()
            .eq("waitlist_id", id)
            .eq("email", email);

          if (error) {
            throw HttpError.BadRequest(error.message);
          }

          return {
            success: !error,
          };
        },
        {
          query: t.Object({
            email: t.String({
              type: "email",
            }),
          }),
          detail: {
            description: "Delete email from waitlist",
          },
        },
      )
      .get(
        "/:id/settings",
        async ({ params: { id }, HttpError }) => {
          const { data, error } = await supabase
            .from("waitlist_settings")
            .select()
            .eq("waitlist_id", id);

          if (error) {
            throw HttpError.BadRequest(error.message);
          }

          return data;
        },
        {
          detail: {
            tags: ["Authorized"],
            description: "Get waitlist settings",
          },
        },
      )
      .put(
        "/:id/settings",
        async ({ body, params: { id }, HttpError }) => {
          const { data, error } = await supabase
            .from("waitlist_settings")
            .update(body)
            .eq("waitlist_id", id);

          if (error) {
            throw HttpError.BadRequest(error.message);
          }

          return data;
        },
        {
          body: t.Object({
            settings: t.Object({
              points_per_confirmed_referral: t.Number({ minimum: 0 }),
              confirmation_settings: t.Object({
                automatic: t.Boolean(),
                enable_confirmation_email: t.Boolean(),
                custom_redirect_url: t.Optional(
                  t.Nullable(
                    t.String({
                      format: "url",
                    }),
                  ),
                ),
              }),
              notification_settings: t.Object({
                email: t.Boolean(),
              }),
              email_sender: t.Optional(
                t.Object({
                  reply_to: t.Optional(t.Nullable(t.String())),
                  email_logo: t.Optional(t.Nullable(t.String())),
                  sender_email: t.Optional(t.Nullable(t.String())),
                  sender_name: t.Optional(t.Nullable(t.String())),
                }),
              ),
              user_emails: t.Object({
                new_signup: t.Boolean(),
                referral_confirmation: t.Boolean(),
                access_granted: t.Boolean(),
              }),
            }),
          }),
          detail: {
            tags: ["Authorized"],
            description: "Update waitlist settings",
          },
        },
      ),
  );
