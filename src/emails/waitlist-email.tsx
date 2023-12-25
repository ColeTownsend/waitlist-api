import {
  Body,
  Container,
  Heading,
  Html,
  Preview,
  Text,
  Button,
  Link,
  Row,
  Tailwind,
  Img,
  Hr,
  Column,
} from "@react-email/components";
import * as React from "react";

interface WaitlistEmailProps {
  name: string;
  link: string;
}

export const WaitlistEmail = ({
  name = "Cole Townsend",
  link = "https://testinglink.com/asdasdasdaasdasdasdasdasd",
}: WaitlistEmailProps) => (
  <Html>
    <Preview>Thank you for joining our waitlist and for your patience</Preview>
    <Tailwind>
      <Body style={main}>
        <Container style={container}>
          <Heading className="text-2xl font-medium mb-4">Coming Soon.</Heading>
          <Text className="text-base mb-8 color-gray-800">
            Thank you {name} for joining our waitlist and for your patience. We will send you
            another email when you get access.
          </Text>
          <Button
            className="bg-[#000000] px-4 py-2 rounded-md text-white text-[14px] font-semibold no-underline text-center"
            href={link}
          >
            Confirm your signup
          </Button>
          <Text className="text-base mt-8 mb-4 mb-2">
            Or copy and paste this link into your browser{" "}
          </Text>
          <Text className="mt-0 p-0">
            <Link href={link} className="text-base text-blue-600 no-underline">
              {link}
            </Link>
          </Text>
          <Hr />
          <Row className="mt-4">
            <Column className="w-6 mr-2 pr-2 align-center align-baseline" style={{ width: 43 }}>
              <Img
                alt="Logo for Early"
                height={17}
                width={33}
                src={"http://localhost:3000/public/logo.png"}
              />
            </Column>
            <Column>
              <Text className="m-0 text-sm font-medium align-baseline">Waitlist by Early.</Text>
            </Column>
          </Row>
        </Container>
      </Body>
    </Tailwind>
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

export default WaitlistEmail;
