import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/constants";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <BrandLogo size="lg" />
          <p className="text-sm text-muted-foreground">
            Sign in with your @{ALLOWED_EMAIL_DOMAIN} account
          </p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-muted-foreground">
          No public registration. Accounts are created by an administrator.
        </p>
      </div>
    </div>
  );
}
