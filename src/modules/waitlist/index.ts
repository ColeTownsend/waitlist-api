import { Elysia, t } from "elysia";

import { resend, supabase } from "../../libs";
import { apiKey } from "../../plugins/apiKey";

import { httpErrorDecorator } from "../../plugins/httpError";
import { authenticateKey } from "../../libs/authenticateKey";
import { WaitlistEmail } from "./waitlist-email";

// @TODO Find a better way to verify key is legit and belongs to a given waitlist
// Ideas???

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
      .use(apiKey())
      // Validate the API key
      .use(authenticateKey)
      .get(
        "/:id",
        async ({ params: { id }, HttpError, organizationId }) => {
          console.log(organizationId);
          // Lookup waitlist by ID.
          // @TODO gotta be a better way to do this
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
        async ({ params: { id }, body, HttpError, organizationId }) => {
          // Lookup waitlist by ID.
          // @TODO gotta be a better way to do this
          const { data: waitlist, error: waitlistError } = await supabase
            .from("waitlists")
            .select("id, name, waitlist_settings(settings)")
            .eq("id", id)
            .eq("organization_id", organizationId)
            .limit(1)
            .maybeSingle();

          console.log(waitlist?.waitlist_settings[0].settings);

          if (waitlistError) {
            throw HttpError.Internal(waitlistError.message);
          }
          if (!waitlist) {
            throw HttpError.NotFound("Waitlist not found");
          }

          const settings = waitlist.waitlist_settings[0].settings as WaitlistSettings;

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
                to: ["cole@twnsnd.co"],
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
        async ({ params: { id }, query: { email }, organizationId, HttpError }) => {
          // Lookup waitlist by ID.
          // @TODO gotta be a better way to do this
          const { data: waitlist, error: waitlistError } = await supabase
            .from("waitlists")
            .select("id")
            .eq("id", id)
            .eq("organization_id", organizationId)
            .limit(1)
            .maybeSingle();

          if (waitlistError) {
            throw HttpError.Internal(waitlistError.message);
          }
          if (!waitlist) {
            throw HttpError.NotFound("Waitlist not found");
          }

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
