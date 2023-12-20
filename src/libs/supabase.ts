import { RealtimePostgresChangesPayload, createClient } from "@supabase/supabase-js";
import { Database } from "../database.types";
import { WaitlistDataStore } from "@libs/cache";

const { SUPABASE_URL, SERVICE_ROLE_KEY } = process.env;

export const supabase = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

type WaitlistType = Database["public"]["Tables"]["waitlists"]["Row"]; // ...

export function initializeRealtimeListener(cache: WaitlistDataStore) {
  const sb = supabase
    .channel("waitlists")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "waitlists",
      },
      async (payload: RealtimePostgresChangesPayload<WaitlistType>) => {
        console.log(payload.eventType);
        switch (payload.eventType) {
          case "INSERT":
            // Code to create waitlist cache
            await cache.updateWaitlistData(payload.new.id, payload.new as WaitlistType);
            break;
          case "UPDATE":
            // Code to update waitlist cache
            await cache.updateWaitlistData(payload.new.id, payload.new as WaitlistType);
            break;
          case "DELETE":
            // Code to delete waitlist cache
            await cache.deleteWaitlistData(payload.old.id as string);
            break;
          default:
            break;
        }
      },
    )
    .subscribe();
}
