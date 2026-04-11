type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

import { Card, CardContent, CardHeader } from "@heroui/react";

export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="mx-auto flex w-full max-w-4xl justify-center px-6 pt-8">
        <div className="w-full max-w-md rounded-md border border-dashed border-zinc-400 px-4 py-3 text-center text-sm text-zinc-600 dark:border-zinc-600 dark:text-zinc-300">
          Company Logo Placeholder
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-84px)] w-full items-center justify-center px-6 py-8">
        <Card className="w-full max-w-md rounded-2xl border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-black">
          <CardHeader className="flex flex-col items-start gap-1 p-6 pb-0">
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
          </CardHeader>
          <CardContent className="p-6 pt-4">{children}</CardContent>
        </Card>
      </main>
    </div>
  );
}
