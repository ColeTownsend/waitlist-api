import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Button
} from "@react-email/components";
import * as React from "react";

interface WaitlistEmailProps {
  name: string;
  link: string;
}

export const WaitlistEmail = ({ name, link }: WaitlistEmailProps) => (
  <Html>
    <Head />
    <Preview>Thank you for joining our waitlist and for your patience</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Coming Soon.</Heading>
        <Text style={text}>
          Thank you {name} for joining our waitlist and for your patience. We
          will send you another email when you get access.
        </Text>
        <Button href={link}>Confirm your signup</Button>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: "#fff",
  margin: "0 auto",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
  margin: "auto",
  padding: "96px 20px 64px",
};

const h1 = {
  color: "#000",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "40px",
  margin: "0 0 20px",
};

const text = {
  color: "#444",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "0 0 40px",
};