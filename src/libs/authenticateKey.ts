import { Elysia } from "elysia";
import { cookie } from "@elysiajs/cookie";

import { supabase } from "./supabase";
import apiKey from "../plugins/apiKey";
import { httpErrorDecorator } from "../plugins/httpError";

export const authenticateKey = (app: Elysia) =>
  app
    .use(apiKey())
    .use(httpErrorDecorator)
    .derive(async ({ api_key, HttpError }) => {
      if (!api_key) {
        throw new Error("API KEY REQUIRED");
      }

      const { data, error } = await supabase
        .from("api_tokens")
        .select("token, organization_id")
        .eq("token", api_key)
        .limit(1)
        .maybeSingle();

      if (!data?.organization_id) {
        throw HttpError.NotFound("Invalid API Key for this waitlist");
      }

      if (data?.organization_id) {
        return {
          organizationId: data.organization_id,
        };
      }

      if (error) {
        throw error;
      }
    });
