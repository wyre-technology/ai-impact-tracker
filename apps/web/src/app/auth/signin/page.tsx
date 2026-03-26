"use client";

import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-bg">
      <div className="w-full max-w-sm rounded-xl border border-dark-border bg-dark-card p-8 text-center">
        {/* Logo */}
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-wyre-600">
          <span className="text-lg font-bold text-white">W</span>
        </div>

        <h1 className="text-xl font-bold text-white">WYRE AI Impact Tracker</h1>
        <p className="mt-2 text-sm text-gray-400">
          Sign in with your WYRE account to continue
        </p>

        <button
          onClick={() => signIn("azure-ad", { callbackUrl: "/dashboard" })}
          className="mt-6 w-full rounded-lg bg-wyre-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-wyre-700 transition-colors"
        >
          Sign in with Microsoft
        </button>

        {/* Dev bypass */}
        {process.env.NEXT_PUBLIC_DEV_BYPASS === "true" && (
          <button
            onClick={() =>
              signIn("credentials", {
                email: "dev@wyretechnology.com",
                callbackUrl: "/dashboard",
              })
            }
            className="mt-3 w-full rounded-lg border border-dark-border px-4 py-2.5 text-sm font-medium text-gray-400 hover:bg-dark-hover transition-colors"
          >
            Dev Bypass Login
          </button>
        )}
      </div>
    </div>
  );
}
