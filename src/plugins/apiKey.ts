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
     * @default x-linefor-key
     */
    header?: string;
  };
}

export const apiKey = (
  {
    extract: { body = "api_key", query = "api_key", header = "Bearer" } = {
      body: "api_key",
      query: "api_key",
      header: "x-linefor-key",
    },
  }: BearerOptions = {
    extract: {
      body: "api_key",
      query: "api_key",
      header: "x-linefor-key",
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
        if (headers?.["x-linefor-key"]) {
          apiKey = headers?.["x-linefor-key"];
        }

        const q = queries[query];
        if (q) {
          apiKey = q;
        }
        return apiKey;
      },
    }))
    .onTransform((ctx) => {
      console.log(ctx);
      if (!ctx.headers?.["x-linefor-key"] && ctx.request.method !== "OPTIONS") {
        throw new ApiKeyAuthError("Unauthorized");
      }
    });

export default apiKey;
