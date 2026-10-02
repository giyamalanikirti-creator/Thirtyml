import Link from "next/link";

import { getUserAndProfile } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";

/** Shows "Sign in" when logged out, user initial when logged in. */
export async function HeaderAuth() {
  const session = await getUserAndProfile().catch(() => null);
  if (!session) {
    return (
      <div className="ml-1 flex items-center gap-1.5">
        <Link
          href="/login"
          className={buttonVariants({ variant: "ghost", size: "sm" }) + " hidden sm:inline-flex"}
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className={buttonVariants({ variant: "primary", size: "sm" })}
        >
          Sign up
        </Link>
      </div>
    );
  }
  const initial =
    session.profile.full_name?.[0]?.toUpperCase() ??
    session.profile.email?.[0]?.toUpperCase() ??
    "U";
  return (
    <Link
      href="/account"
      aria-label="Account"
      className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-plum text-sm font-semibold text-moon hover:bg-plum-deep"
    >
      {initial}
    </Link>
  );
}
