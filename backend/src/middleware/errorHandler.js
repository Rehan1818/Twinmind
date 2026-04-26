/**
 * Map low-level network/DNS errors (often from axios/fetch) to HTTP 503.
 * @param {unknown} err
 * @returns {{ status: number, code: string, message: string } | null}
 */
function mapNetworkFailure(err) {
  const code =
    (err && typeof err === "object" && "code" in err && err.code) ||
    (err && typeof err === "object" && "cause" in err && err.cause && err.cause.code);
  const dnsOrNet = ["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ETIMEDOUT", "ENETUNREACH", "EHOSTUNREACH"];
  if (typeof code === "string" && dnsOrNet.includes(code)) {
    const hint =
      code === "ENOTFOUND" || code === "EAI_AGAIN"
        ? "DNS could not resolve the Groq API host (api.groq.com). Check internet, VPN, firewall, and DNS settings (try 8.8.8.8 or 1.1.1.1)."
        : "Could not connect to Groq. Check internet, VPN, proxy (HTTPS_PROXY), and firewall.";
    return { status: 503, code: "UPSTREAM_UNREACHABLE", message: hint };
  }
  return null;
}

/**
 * Centralised error → HTTP response mapping.
 * @type {import('express').ErrorRequestHandler}
 */
export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  const network = mapNetworkFailure(err);
  let statusCode =
    typeof err.statusCode === "number" && err.statusCode >= 400 && err.statusCode < 600
      ? err.statusCode
      : 500;

  let errorCode = err.code || (statusCode === 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR");
  let message = err.message || "Unexpected error";

  if (network) {
    statusCode = network.status;
    errorCode = network.code;
    message = network.message;
  }

  const payload = {
    error: {
      code: errorCode,
      message,
    },
  };

  if (process.env.NODE_ENV !== "production" && err.stack) {
    payload.error.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}
