import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./db";

const COOKIE_NAME = "schulze_token";
const TOKEN_EXPIRY = "1h";

// --- Password helpers ---

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// --- JWT helpers ---

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret?.trim()) {
    throw new Error("JWT_SECRET must be set in the environment");
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(TOKEN_EXPIRY)
    .setIssuedAt()
    .sign(getJwtSecret());
}

export async function verifyToken(
  token: string
): Promise<{ userId: string } | null> {
  const secret = getJwtSecret();
  try {
    const { payload } = await jwtVerify(token, secret);
    return { userId: payload.userId as string };
  } catch {
    return null;
  }
}

// --- Session helper ---

export async function getSessionUser(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const token = parseCookie(cookieHeader, COOKIE_NAME);
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  return user;
}

// --- Cookie helpers ---

function secureCookieAttribute(): string {
  const configured = process.env.AUTH_COOKIE_SECURE;
  if (configured !== undefined && configured !== "true" && configured !== "false") {
    throw new Error("AUTH_COOKIE_SECURE must be 'true' or 'false'");
  }
  const secure = configured === undefined
    ? process.env.NODE_ENV === "production"
    : configured === "true";
  return secure ? "; Secure" : "";
}

export function createAuthCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=86400${secureCookieAttribute()}`;
}

export function clearAuthCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secureCookieAttribute()}`;
}

function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? match.split("=")[1] : null;
}
