import { swagger } from "@elysiajs/swagger";
import { Elysia, t } from "elysia";
import { serverTiming } from "@elysiajs/server-timing";
// import { ip } from "./plugins/ip";
import { admin, auth, waitlist, waitlist_email } from "./modules";
import { httpError } from "./plugins/httpError";
import { rateLimit } from "elysia-rate-limit";
import { initializeRealtimeListener } from "@libs/supabase";
import { WaitlistDataStore } from "@libs/cache";
import { redis } from "./libs";

const app = new Elysia()
  .use(rateLimit())
  .use(httpError())
  .use(
    swagger({
      autoDarkMode: true,
      documentation: {
        info: {
          title: "Early API",
          version: "0.1.0",
        },
        security: [
          {
            ApiKeyAuth: [],
          },
        ],
        components: {
          securitySchemes: {
            ApiKeyAuth: {
              type: "apiKey",
              name: "x-early-key",
              in: "header",
            },
          },
        },
        tags: [
          {
            name: "Authorized",
            description: "Need a 'access_token' and 'refresh_token' cookie for authorization",
          },
          {
            name: "Authentication",
            description: "For user authentication",
          },
        ],
      },
    }),
  )
  // .use(ip())
  .use(serverTiming())
  .use(waitlist)
  .use(auth)
  .use(admin)
  .use(waitlist_email)
  .decorate("cache", new WaitlistDataStore(redis))
  .onStart(async ({ cache }) => {
    initializeRealtimeListener(cache);
    console.log("Supabase Realtime Listener Initialized");
  })
  .listen(process.env.PORT || 3000);

console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);
