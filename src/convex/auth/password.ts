import { Password } from "@convex-dev/auth/providers/Password";
import axios from "axios";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

export const password = Password({
  id: "password",
  verify: {
    async generateVerificationToken() {
      const random: RandomReader = {
        read(bytes: Uint8Array) {
          crypto.getRandomValues(bytes);
        },
      };
      const alphabet = "0123456789";
      return generateRandomString(random, alphabet, 6);
    },
    async sendVerificationRequest({ identifier: email, token }) {
      try {
        await axios.post(
          "https://email.vly.ai/send_otp",
          {
            to: email,
            otp: token,
            appName: "HealthcareCompanion",
          },
          {
            headers: {
              "x-api-key": "vlytothemoon2025",
            },
          },
        );
      } catch (error) {
        throw new Error(JSON.stringify(error));
      }
    },
  },
});
