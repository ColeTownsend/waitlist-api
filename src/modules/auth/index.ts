import { cookie } from "@elysiajs/cookie";
import { Elysia, t } from "elysia";

import { supabase } from "../../libs";

const signDTO = t.Object({
  email: t.String({
    format: "email",
  }),
  password: t.String({
    minLength: 8,
  }),
});

export const auth = (app: Elysia) =>
  app
    .use(
      cookie({
        httpOnly: true,
        secure: true,
        path: "/",
      }),
    )
    .group("/auth", (app) =>
      app
        .post(
          "/sign-up",
          async ({ body }) => {
            const { data, error } = await supabase.auth.signUp(body);

            if (error) {
              return error;
            }
            return data.user;
          },
          {
            body: signDTO,
            detail: {
              description: "Sign up a new user",
              tags: ["Authentication"],
            },
          },
        )
        .post(
          "/sign-in",
          async ({ body, setCookie }) => {
            const { data, error } = await supabase.auth.signInWithPassword(body);

            if (error) {
              return error;
            }

            setCookie("refresh_token", data.session!.refresh_token);
            setCookie("access_token", data.session!.access_token);

            return data.user;
          },
          {
            body: signDTO,
            detail: {
              description: "Sign in a user",
              tags: ["Authentication"],
            },
          },
        )
        .get(
          "/refresh",
          async ({ setCookie, cookie: { refresh_token } }) => {
            const { data, error } = await supabase.auth.refreshSession({
              refresh_token,
            });

            if (error) {
              return error;
            }

            setCookie("refresh_token", data.session!.refresh_token);

            return data.user;
          },
          {
            detail: {
              description: "Renew access_token",
              tags: ["Authentication", "Authorized"],
            },
          },
        ),
    );
