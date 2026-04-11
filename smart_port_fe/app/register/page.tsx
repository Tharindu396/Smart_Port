import Link from "next/link";
import AuthShell from "../components/auth-shell";
import { Button, Input } from "@heroui/react";

export default function RegisterPage() {
  return (
    <AuthShell title="Register" subtitle="Create your Smart Port account.">
      <form className="space-y-4" aria-label="registration form">
        <div className="space-y-1">
          <label htmlFor="fullName" className="block text-sm font-medium">
            Full Name
          </label>
          <Input
            id="fullName"
            type="text"
            name="fullName"
            placeholder="Your full name"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            name="email"
            placeholder="you@company.com"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            type="password"
            name="password"
            placeholder="Create a password"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700"
          />
        </div>

        <Button
          type="submit"
          className="w-full rounded-md border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Register
        </Button>
      </form>

      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-2">
          Login
        </Link>
      </p>
    </AuthShell>
  );
}
