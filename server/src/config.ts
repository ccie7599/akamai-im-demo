import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, "../../.env") })

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  edgercPath: process.env.EDGERC_PATH || path.resolve(process.env.HOME || "~", ".edgerc"),
  edgercSection: process.env.EDGERC_SECTION || "default",
  ds2WebhookUsername: process.env.DS2_WEBHOOK_USERNAME || "ds2-demo",
  ds2WebhookPassword: process.env.DS2_WEBHOOK_PASSWORD || "changeme",
  akamaiHost: process.env.AKAMAI_PROPERTY_HOSTNAME || "demo.example.com",
  edgeworkerId: process.env.AKAMAI_EDGEWORKER_ID || "",
  cpCode: process.env.AKAMAI_CP_CODE || "",
  authToken: process.env.API_AUTH_TOKEN || "",
}
