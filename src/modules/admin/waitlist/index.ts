import { Elysia, t } from "elysia";

import { authen, supabase } from "../../../libs";

const SIZE = 50;

export const admin = (app: Elysia) =>
  app.group("/admin/waitlist", (app) =>
    app
      .use(authen)
      .get(
        "/:id",
        async ({ params: { id } }) => {
          const { data, error } = await supabase
            .from("waitlists")
            .select("*, waitlist_signups(count), waitlist_referrals(count)")
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
      .get(
        "/:id/emails",
        async ({ params: { id }, query: { page } }) => {
          const limit = SIZE ? +SIZE : SIZE;
          const from = page ? (Number(page) - 1) * limit : 0;
          const to = page ? from + SIZE : SIZE;

          console.log({ from, to });

          const { data, error } = await supabase
            .from("waitlist_signups")
            .select("id,email,points,joined_at,unique_share_code", { count: "exact" })
            .eq("waitlist_id", id)
            .range(from, to);

          if (error) {
            return error;
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
        async ({ body }) => {
          const { data, error } = await supabase
            .rpc("create_new_waitlist", {
              waitlist_name: body.name,
              org_id: body.org_id,
            })
            .select("id")
            .limit(1)
            .maybeSingle();

          if (error) {
            throw error;
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
      .get(
        "/:id/settings",
        async ({ params: { id } }) => {
          const { data, error } = await supabase
            .from("waitlist_settings")
            .select()
            .eq("waitlist_id", id);

          if (error) {
            throw error;
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
        async ({ body, params: { id } }) => {
          const { data, error } = await supabase
            .from("waitlist_settings")
            .update(body)
            .eq("waitlist_id", id);

          if (error) {
            throw error;
          }

          return data;
        },
        {
          body: t.Object({
            settings: t.Object({
              points_per_confirmed_referral: t.Number(),
              confirmation_settings: t.Object({
                automatic: t.Boolean(),
                enable_confirmation_email: t.Boolean(),
              }),
              notification_settings: t.Object({
                email: t.Boolean(),
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
