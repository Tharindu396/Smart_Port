"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import AuthShell from "../components/auth-shell";
import { Button, Input, Label, TextField } from "@heroui/react";
import { ApiError, authApi, type UserRole } from "@/lib/api";

const roleOptions: Array<{ label: string; value: UserRole }> = [
  { label: "Shipping Agent", value: "shipping_agent" },
  { label: "Berth Planner", value: "berth_planner" },
  { label: "Finance Officer", value: "finance_officer" },
  { label: "Operations Staff", value: "operations_staff" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("shipping_agent");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    setError(null);
    setLoading(true);

    try {
      await authApi.register({
        name: fullName,
        email,
        password,
        role,
      });
      setNotice("Registration successful. Redirecting to login...");
      router.push("/login");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Registration failed");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Register" subtitle="Create your Smart Port account.">
      <form className="space-y-4" aria-label="registration form" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <TextField isRequired>
          <Label htmlFor="fullName" className="block text-sm font-medium">
            Full Name
          </Label>
          <Input
            id="fullName"
            type="text"
            name="fullName"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Your full name"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700"
            
          />
          </TextField>
        </div>

        <div className="space-y-1">
          <TextField isRequired>
          <Label htmlFor="email" className="block text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700"
            
          />
          </TextField>
        </div>

        <div className="space-y-1">
          <label htmlFor="role" className="block text-sm font-medium">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole)}
            className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700"
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value} className="text-black">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <TextField isRequired>
          <Label htmlFor="password" className="block text-sm font-medium">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Create a password"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700"
            
          />
          </TextField>
        </div>

        {notice && <p className="text-sm text-warning">{notice}</p>}
        {error && <p className="text-sm text-danger">{error}</p>}

        <Button
          type="submit"
          className="w-full rounded-md border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          isPending={loading}
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
