// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://8521fea573d8112b16b51e0610ac2bcb@o4510784958955520.ingest.us.sentry.io/4510784982351872",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Disable Prisma integration to prevent build errors on Vercel
  // The prismaIntegration imports @prisma/instrumentation which has
  // Node.js-only dependencies (require-in-the-middle) that fail during bundling
  integrations(integrations) {
    return integrations.filter(
      (integration) => integration.name !== "Prisma"
    );
  },

  // Skip OpenTelemetry setup to prevent additional instrumentation conflicts
  skipOpenTelemetrySetup: true,
});
