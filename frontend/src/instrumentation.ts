import * as Sentry from "@sentry/nextjs";

export async function register() {
  // Only load Sentry configs in Node.js runtime, not Edge
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  // Skip edge runtime config to avoid bundling Node.js-specific modules
}

export const onRequestError = Sentry.captureRequestError;
