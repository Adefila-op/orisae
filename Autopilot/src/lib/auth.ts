import "server-only";

import * as jwt from "jsonwebtoken";

type CreatorIdentity = {
  creatorId?: string | null;
  walletAddress?: string | null;
};

function parseBearer(authorization: string | null) {
  if (!authorization) return null;
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

function parseDevelopmentToken(token: string) {
  try {
    const parsed = JSON.parse(Buffer.from(token, "base64").toString("utf8")) as CreatorIdentity;
    return parsed?.creatorId || parsed?.walletAddress ? parsed : null;
  } catch {
    return null;
  }
}

function parseJwtToken(token: string) {
  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "autopilot_dev_secret_key_change_in_production",
    ) as Record<string, unknown> | string;
    if (typeof payload === "string") return null;
    return {
      creatorId:
        typeof payload.creatorId === "string"
          ? payload.creatorId
          : typeof payload.id === "string"
            ? payload.id
            : null,
      walletAddress:
        typeof payload.wallet_address === "string"
          ? payload.wallet_address
          : typeof payload.walletAddress === "string"
            ? payload.walletAddress
            : null,
    };
  } catch {
    return null;
  }
}

export function resolveCreatorIdentity(input: {
  authorization?: string | null;
  creatorIdHeader?: string | null;
  walletHeader?: string | null;
}) {
  if (input.creatorIdHeader || input.walletHeader) {
    return {
      creatorId: input.creatorIdHeader || null,
      walletAddress: input.walletHeader || null,
    };
  }

  const token = parseBearer(input.authorization || null);
  if (!token) return null;

  return parseJwtToken(token) || parseDevelopmentToken(token);
}
