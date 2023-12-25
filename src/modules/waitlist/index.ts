// Public API Calls for Waitlist
import { Elysia, t } from "elysia";

import { redis, resend, supabase } from "../../libs";

import { httpErrorDecorator } from "@plugins/httpError";
import WaitlistEmail from "emails/waitlist-email";
import { WaitlistDataStore } from "@libs/cache";
import { KafkaService, kafka } from "@libs/kafka";

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

export const waitlist = (app: Elysia) =>
  app.group("/waitlist", (app) =>
    app
      .use(httpErrorDecorator)
      .decorate("cache", new WaitlistDataStore(redis))
      .decorate("events", new KafkaService(kafka))
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
        async ({ params: { id }, HttpError }) => {
          const { data, error } = await supabase
            .from("public_waitlists")
            .select("*")
            .eq("id", id)
            .limit(1)
            .maybeSingle();

          if (error) {
            console.error(error);
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
      // @TODO add some protection here like captcha + deduping + fingerprinting
      .post(
        "/:id/join",
        async ({ params: { id }, body, HttpError, events }) => {
          console.log("Waitlist id", id);
          const { data: waitlist_settings, error } = await supabase
            .from("waitlist_settings")
            .select("settings")
            .eq("waitlist_id", id)
            .limit(1)
            .maybeSingle();

          if (error) {
            console.error("Error", error);
            throw HttpError.BadRequest(error.message);
          }
          if (!waitlist_settings) {
            console.log("No data here....", waitlist_settings);
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

          // Kafka Events
          events.joined_waitlist(newSignup);
          if (settings?.confirmation_settings.automatic) {
            events.confirmed_signup(newSignup);
            if (newSignup.referred) {
              events.confirmed_referral(newSignup);
            }
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
                react: WaitlistEmail({
                  link: `http://localhost:3000/waitlist/${id}/confirmation?token=${newSignup.confirmation_token}`,
                  name: "Test User",
                }),
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
      ),
  );
