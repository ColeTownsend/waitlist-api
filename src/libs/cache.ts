import { Redis } from "@upstash/redis";
import { t, Static } from "elysia";

export const WaitlistData = t.Object({
  id: t.String({
    format: "uuid",
  }),
  organization_id: t.Number(),
  name: t.String(),
  description: t.Nullable(t.String()),
});

export type WaitlistData = Static<typeof WaitlistData>;

export const ApiTokenData = t.Object({
  token: t.String({
    format: "uuid",
  }),
  organization_id: t.Number(),
});

export type ApiTokenData = Static<typeof ApiTokenData>;

export const UserWaitlistPosition = t.Object({
  id: t.String({
    format: "uuid",
  }),
  points: t.Number(),
  email: t.String({
    format: "email",
  }),
  waitlist_id: t.String({
    format: "uuid",
  }),
  unique_share_code: t.String(),
});

export type UserWaitlistPosition = Static<typeof UserWaitlistPosition>;

export class WaitlistDataStore {
  private client: Redis;
  static readonly WAITLIST_PREFIX = "waitlist";
  static readonly WAITLIST_DATA_PREFIX = `${WaitlistDataStore.WAITLIST_PREFIX}:data`;
  static readonly TOKEN_PREFIX = `${WaitlistDataStore.WAITLIST_PREFIX}:api_token`;

  constructor(client: Redis) {
    this.client = client;
  }

  private userWaitlistPositionKey(email: string, waitlistId: string): string {
    return `${WaitlistDataStore.WAITLIST_PREFIX}:${waitlistId}:user:${email}`;
  }

  private waitlistDataKey(waitlistId: string): string {
    return `${WaitlistDataStore.WAITLIST_PREFIX}:data:${waitlistId}`;
  }

  private apiTokenKey(token: string): string {
    return `${WaitlistDataStore.TOKEN_PREFIX}:${token}`;
  }

  async getWaitlistData(waitlistId: string): Promise<WaitlistData | null> {
    return await this.client.hgetall(this.waitlistDataKey(waitlistId));
  }

  async updateWaitlistData(waitlistId: string, data: WaitlistData): Promise<void> {
    await this.client.hmset(this.waitlistDataKey(waitlistId), data);
  }

  async deleteWaitlistData(waitlistId: string): Promise<void> {
    await this.client.del(this.waitlistDataKey(waitlistId));
  }

  async createTokenData(data: ApiTokenData): Promise<void> {
    await this.client.hmset(this.apiTokenKey(data.token), data);
  }

  async getTokenData(token: string): Promise<ApiTokenData | null> {
    return await this.client.hgetall(this.apiTokenKey(token));
  }

  async updateTokenData(token: string, data: Partial<ApiTokenData>): Promise<void> {
    await this.client.hmset(this.apiTokenKey(token), data);
  }

  async deleteTokenData(token: string): Promise<void> {
    await this.client.del(this.apiTokenKey(token));
  }

  async createUserWaitlistPositionData(
    data: UserWaitlistPosition,
    waitlistId: string,
  ): Promise<void> {
    await this.client.hmset(this.userWaitlistPositionKey(data.email, waitlistId), data);
  }

  async getUserWaitlistPositionData(
    email: string,
    waitlistId: string,
  ): Promise<UserWaitlistPosition | null> {
    return await this.client.hgetall(this.userWaitlistPositionKey(email, waitlistId));
  }

  async updateUserWaitlistPositionData(
    email: string,
    waitlistId: string,
    data: Partial<UserWaitlistPosition>,
  ): Promise<void> {
    await this.client.hmset(this.userWaitlistPositionKey(email, waitlistId), data);
  }

  async deleteUserWaitlistPositionData(email: string, waitlistId: string): Promise<void> {
    await this.client.del(this.userWaitlistPositionKey(email, waitlistId));
  }
}
