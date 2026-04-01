import { cookies } from "next/headers";

const ACTING_CUSTOMER_COOKIE = "acting_customer_id";

export async function getActingCustomerId() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ACTING_CUSTOMER_COOKIE)?.value;
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function setActingCustomerId(customerId) {
  const cookieStore = await cookies();
  cookieStore.set(ACTING_CUSTOMER_COOKIE, String(customerId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });
}
