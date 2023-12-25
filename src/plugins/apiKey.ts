import { Elysia, type Context } from "elysia";

export class ApiKeyAuthError extends Error {
  constructor(public message: string) {
    super(message);
  }
}

export interface BearerOptions {
  /**
   * If the API doesn't compliant with RFC6750
   * The key for extracting the token is configurable
   */
  extract: {
    /**
     * Determined which fields to be identified as Bearer token
     *
     * @default api_key
     */
    body?: string;
    /**
     * Determined which fields to be identified as Bearer token
     *
     * @default api_key
     */
    query?: string;
    /**
     * Determined which type of Authentication should be Bearer token
     *
     * @default x-early-key
     */
    header?: string;
  };
}

export const apiKey = (
  {
    extract: { body = "api_key", query = "x-early-key", header = "x-early-key" } = {
      body: "api_key",
      query: "x-early-key",
      header: "x-early-key",
    },
  }: BearerOptions = {
    extract: {
      body: "api_key",
      query: "x-early-key",
      header: "x-early-key",
    },
  },
) =>
  new Elysia({
    name: "@elysiajs/apiKey",
    seed: {
      body,
      query,
      header,
    },
  })
    .derive(({ query: queries, headers }) => ({
      get api_key() {
        let apiKey;
        if (headers?.["x-early-key"]) {
          apiKey = headers?.["x-early-key"];
        }

        const q = queries[query];
        if (q) {
          apiKey = q;
        }
        return apiKey;
      },
    }))
    .onTransform((ctx) => {
      if (!ctx.api_key && ctx.request.method !== "OPTIONS") {
        throw new ApiKeyAuthError("Unauthorized");
      }
    });

export default apiKey;
