import { swagger } from "@elysiajs/swagger";
import { Elysia, t } from "elysia";
import { serverTiming } from "@elysiajs/server-timing";
import { ip } from "./plugins/ip";
import { admin, auth, waitlist } from "./modules";
import { httpError } from "./plugins/httpError";

const app = new Elysia()
  .use(httpError())
  .use(
    swagger({
      documentation: {
        info: {
          title: "Linefor API",
          version: "0.1.0",
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
  .use(ip())
  .use(serverTiming())
  .use(waitlist)
  .use(auth)
  .use(admin)
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
