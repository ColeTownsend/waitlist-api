// import { Elysia, type Context } from "elysia";

// import { Client } from "@upstash/qstash";

// const connection = new Redis(options);

// export const redisQueueService = new Elysia({ name: "redisQueueService" })
//   .decorate({ connection })
//   .use(loggerService) // exposes logger

//   .derive(({ connection, logger }) => ({
//     createQueue: (name: string) => {
//       const queue = new Queue(name, { connection });

//       connection.once("connect", () => {
//         logger.info(`${name}::Connected with credentials:${queue.token}`, options);
//       });

//       return queue;
//     },
//   }));
