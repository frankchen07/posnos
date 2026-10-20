import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, authToken } from "@/lib/auth";

async function login(formData: FormData) {
  "use server";
  const password = process.env.POSNOS_PASSWORD;
  if (!password || formData.get("password") !== password) redirect("/login?error=1");

  (await cookies()).set(AUTH_COOKIE, await authToken(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  redirect("/");
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center bg-cream p-4">
      <form action={login} className="flex flex-col gap-3">
        <h1 className="font-bold text-espresso">Boast Catering Orders</h1>
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoFocus
          required
          className="rounded-lg border border-border bg-white px-3 py-2 text-base text-espresso placeholder:text-muted"
        />
        {error && <p className="text-sm text-red-700">Wrong password.</p>}
        <button
          type="submit"
          className="min-h-11 rounded-lg bg-espresso px-4 py-2 font-medium text-cream"
        >
          Enter
        </button>
      </form>
    </div>
  );
}
