// API Waitlist Actions
import { Elysia, t } from "elysia";

import { supabase } from "@libs/supabase";
import { resend } from "@libs/resend";
import { KafkaService, kafka } from "@libs/kafka";
import { apiKey } from "@plugins/apiKey";

import { httpErrorDecorator } from "@plugins/httpError";
import { authenticateKey } from "@libs/authenticateKey";
import { WaitlistEmail } from "emails/waitlist-email";

type WaitlistSettings = {
  confirmation_settings: {
    automatic: boolean;
    enable_confirmation_email: boolean;
  };
  notification_settings: {
    email: boolean;
  };
  points_per_confirmed_referral: number;
};

export const waitlist_api = (app: Elysia) =>
  app.group("/api/v1/waitlist", (app) =>
    app
      .use(httpErrorDecorator)
      .decorate("events", new KafkaService(kafka))
      .use(apiKey()) // get api key + associated org
      .use(authenticateKey) // Validate the API key
      // Verify waitlist exists
      .onBeforeHandle(async ({ params: { id }, set, cache }) => {
        const cachedWaitlist = await cache.getWaitlistData(id);

        if (!cachedWaitlist) {
          // Fallback lookup
          const { data, error } = await supabase
            .from("waitlists")
            .select("id,name,description,organization_id")
            .eq("id", id)
            .limit(1)
            .maybeSingle();

          if (data) {
            await cache.updateWaitlistData(id, data);
          }

          if (error || !data) {
            set.status = "Not Found";
            return set;
          }
        }
      })
      .get(
        "/:id",
        async ({ params: { id }, HttpError, organizationId }) => {
          const { data, error } = await supabase
            .from("waitlists")
            .select("name, description, waitlist_signups(count), waitlist_referrals(count)")
            .eq("id", id)
            .eq("organization_id", organizationId)
            .limit(1)
            .maybeSingle();

          if (error) {
            throw HttpError.BadRequest(error.message);
          }
          if (!data) {
            throw HttpError.NotFound("No waitlist found");
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
        async ({ params: { id }, body, HttpError, events }) => {
          const { data: waitlist_settings, error } = await supabase
            .from("waitlist_settings")
            .select("settings")
            .eq("id", id)
            .limit(1)
            .maybeSingle();

          if (error) {
            throw HttpError.BadRequest(error.message);
          }
          if (!waitlist_settings) {
            throw HttpError.NotFound("No waitlist found");
          }

          const settings = waitlist_settings.settings as WaitlistSettings;

          // get waitlist
          // Find user by referral code
          // Create new waitlist_signup
          const { data: newSignup, error: signupError } = await supabase
            .rpc("create_waitlist_signup", {
              p_waitlist_id: id,
              p_email: body.email,
              p_automatic_confirmation: settings.confirmation_settings.automatic,
              p_referral_code: body.referral_code || undefined,
            })
            .select()
            .limit(1)
            .maybeSingle();

          if (signupError) {
            console.error(signupError);
            throw HttpError.Internal(signupError.message);
          }

          if (!newSignup) {
            throw HttpError.Internal("Could not join waitlist");
          }

          // @TODO Move this to a queue / background task. this is slow.
          // can use qstash https://upstash.com/docs/qstash/overall/getstarted
          // or https://github.com/bee-queue/bee-queue
          if (settings?.confirmation_settings?.enable_confirmation_email) {
            try {
              await resend.emails.send({
                from: "Welcome <onboarding@mail.itsearly.dev>",
                to: [body.email],
                subject: "Joined Waitlist",
                // @TODO make this a url with query param to authenticate the user
                // Do we need a redirect after that?
                react: WaitlistEmail({ link: newSignup.confirmation_token, name: "Test User" }),
              });
            } catch (e) {
              throw HttpError.Internal("Could not send confirmation email");
            }
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
        async ({ params: { id }, query: { email }, HttpError, events }) => {
          // confirm user
          const { data: confirmed_user, error } = await supabase
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

          if (!confirmed_user) {
            console.error(error);
            throw HttpError.NotFound("User not found.");
          }

          events.confirmed_signup(confirmed_user);

          // @TODO fix types here
          if (confirmed_user.referred) {
            events.confirmed_referral(confirmed_user);
          }

          return {
            success: !error,
            data: confirmed_user,
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
