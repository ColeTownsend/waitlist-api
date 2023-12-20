import { swagger } from "@elysiajs/swagger";
import { Elysia, t } from "elysia";
// import { serverTiming } from "@elysiajs/server-timing";
import {
  admin,
  auth,
  waitlist,
  waitlist_api,
  public_waitlist_email,
  confirmation,
} from "./modules";
import { httpError } from "./plugins/httpError";
import { rateLimit } from "elysia-rate-limit";
import { initializeRealtimeListener } from "@libs/supabase";
import { WaitlistDataStore } from "@libs/cache";
import { redis } from "./libs";
import { ip } from "@plugins/ip";

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
  .decorate("cache", new WaitlistDataStore(redis))
  .onStart(async ({ cache }) => {
    initializeRealtimeListener(cache);
    console.log("Supabase Realtime Listener Initialized \n");
  })
  .use(waitlist)
  .use(auth)
  .use(admin)
  .use(ip())
  .use(waitlist_api)
  .use(public_waitlist_email)
  .use(confirmation)
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port} 
  \n🦊 Swagger is running at http://${app.server?.hostname}:${app.server?.port}/swagger`,
);
