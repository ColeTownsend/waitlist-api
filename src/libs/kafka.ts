import { Consumer, Kafka, Producer } from "@upstash/kafka";

export const kafka = new Kafka({
  url: "https://ultimate-lobster-7004-us1-rest-kafka.upstash.io",
  username: "dWx0aW1hdGUtbG9ic3Rlci03MDA0JBCoGwuxjr9KBTD2bPYVx4CtliqX5WQZHA4",
  password: "ZjhlODhlZDAtNTg1Ni00YzljLTk3NDgtNjNlYTg5NjRjNmU3",
});

const KafkaTopics = {
  waitlistReferralConfirmed: "waitlist_referral_confirmed",
  waitlistUserAccessGranted: "waitlist_user_access_granted",
  waitlistUserConfirmed: "waitlist_user_confirmed",
  waitlistUserJoined: "waitlist_user_joined",
};

interface User {
  id: string;
  email: string;
  points: number;
  waitlist_status: "access_granted" | "joined" | "blocked";
  referred: boolean;
  referrals_made: number;
  unique_share_code: string;
  organization_id: number;
  waitlist_id: string;
  joined_at: Date;
  confirmed: boolean;
  confirmation_token: string;
  confirmed_at: Date;
}

// biome-ignore lint/suspicious/noEmptyInterface: Want types here in case we expand
interface JoinedMessage extends User {}

// biome-ignore lint/suspicious/noEmptyInterface: Want types here in case we expand
interface ConfirmationMessage extends User {}

// biome-ignore lint/suspicious/noEmptyInterface: Want types here in case we expand
interface AccessGrantedMessage extends User {}

// biome-ignore lint/suspicious/noEmptyInterface: Want types here in case we expand
export interface ReferralConfirmationMessage extends User {}

export class KafkaService {
  private client: Kafka;
  private producer: Producer;

  constructor(client: Kafka) {
    this.client = client;
    this.producer = client.producer();
  }

  async joined_waitlist(data: any): Promise<void> {
    await this.producer.produce(KafkaTopics.waitlistUserJoined, {
      event: KafkaTopics.waitlistUserJoined,
      event_timestamp: new Date(),
      ...data,
    });
  }

  async confirmed_signup(data: any): Promise<void> {
    await this.producer.produce(KafkaTopics.waitlistUserConfirmed, {
      event: KafkaTopics.waitlistUserConfirmed,
      event_timestamp: new Date(),
      ...data,
    });
  }
  async confirmed_referral(data: any): Promise<void> {
    await this.producer.produce(KafkaTopics.waitlistReferralConfirmed, {
      event: KafkaTopics.waitlistReferralConfirmed,
      event_timestamp: new Date(),
      ...data,
    });
  }

  async access_granted(data: any): Promise<void> {
    await this.producer.produce(KafkaTopics.waitlistUserAccessGranted, {
      event: KafkaTopics.waitlistUserAccessGranted,
      event_timestamp: new Date(),
      ...data,
    });
  }
}
