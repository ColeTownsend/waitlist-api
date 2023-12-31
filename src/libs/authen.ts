import { cookie } from "@elysiajs/cookie";
import { Elysia } from "elysia";

import { supabase } from "./supabase";

export const authen = (app: Elysia) =>
  app.use(cookie()).derive(async ({ cookie: { access_token, refresh_token } }) => {
    const { data, error } = await supabase.auth.getUser(access_token);

    if (data.user) {
      return {
        userId: data.user.id,
      };
    }

    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (refreshError) {
      throw error;
    }

    return {
      userId: refreshed.user!.id,
    };
  });
