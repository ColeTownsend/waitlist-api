import { Elysia } from "elysia";

import { supabase } from "@libs/supabase";
import apiKey from "@plugins/apiKey";
import { httpErrorDecorator } from "@plugins/httpError";
import { WaitlistDataStore } from "@libs/cache";
import { redis } from ".";

export const authenticateKey = (app: Elysia) =>
  app
    .use(apiKey())
    .use(httpErrorDecorator)
    .decorate("cache", new WaitlistDataStore(redis))
    .derive(async ({ api_key, HttpError, cache }) => {
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
