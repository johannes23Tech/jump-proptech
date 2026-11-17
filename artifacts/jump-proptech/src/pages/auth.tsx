import { useState, type FormEvent } from "react";
import { useApp } from "@/state/app";

type Mode = "sign-in" | "sign-up";

export default function AuthScreen() {
  const { signIn, signUp, pending } = useApp();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);

    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    const message =
      mode === "sign-in"
        ? await signIn(email, password)
        : await signUp({
            fullName: String(form.get("fullName") ?? "").trim(),
            company: String(form.get("company") ?? "").trim(),
            email,
            password,
          });

    if (message) setError(message);
  }

  return (
    <div className="flex min-h-screen items-stretch bg-[#f7f5ef]">
      <aside className="hidden w-[42%] flex-col justify-between bg-[#1b1f24] p-10 text-[#f2ecdc] lg:flex">
        <div>
          <div className="font-display text-[30px] font-extrabold tracking-[-.04em]">
            jump<span className="text-[#c5a55a]">.</span>
          </div>
          <div className="mt-1 text-[11px] font-semibold tracking-[.18em] text-white opacity-45">
            PROPERTY WORKSPACE
          </div>
        </div>
        <div>
          <h1 className="font-display text-[43px] font-extrabold leading-tight tracking-[-.04em]">
            Every property, tenant and rent record in one secure workspace.
          </h1>
          <p className="mt-4 max-w-md text-[16px] leading-relaxed text-white opacity-55">
            Jump PropTech keeps your portfolio on your own server. Sign in to
            manage properties, units, leases, rent records and maintenance.
          </p>
          <div className="mt-8 border-l-2 border-[#d2b66f] pl-3 text-[14px] text-white opacity-50">
            Your records are private to your account.
          </div>
        </div>
        <div className="text-[13px] text-white opacity-30">
          Jump Living · Property workspace
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 lg:hidden">
            <div className="font-display text-[25px] font-extrabold tracking-[-.04em]">
              jump<span className="text-[#b79850]">.</span>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-[11px] font-bold tracking-[.18em] text-[#a18a50]">
              {mode === "sign-in" ? "WELCOME BACK" : "CREATE YOUR WORKSPACE"}
            </div>
            <h2 className="mt-2 font-display text-[30px] font-extrabold tracking-[-.03em] text-[#252821]">
              {mode === "sign-in" ? "Sign in" : "Create an account"}
            </h2>
            <p className="mt-1.5 text-[15px] leading-relaxed text-[#77756c]">
              {mode === "sign-in"
                ? "Use the account that owns this portfolio."
                : "Your portfolio starts empty. Add properties once you are in."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "sign-up" && (
              <>
                <Field
                  label="Full name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                />
                <Field
                  label="Business / workspace name"
                  name="company"
                  type="text"
                  autoComplete="organization"
                />
              </>
            )}
            <Field
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
            <Field
              label="Password"
              name="password"
              type="password"
              autoComplete={
                mode === "sign-in" ? "current-password" : "new-password"
              }
              required
              minLength={mode === "sign-up" ? 8 : undefined}
            />

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-[#e7c8c2] bg-[#fbefec] px-3 py-2.5 text-[14px] font-medium text-[#9c4f46]"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#262a2d] text-[15px] font-bold text-[#faf7ee] transition hover:bg-[#414344] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending
                ? "Signing in…"
                : mode === "sign-in"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-[14px] text-[#77756c]">
            <span>
              {mode === "sign-in" ? "New here?" : "Already have an account?"}
            </span>
            <button
              type="button"
              onClick={() => {
                setError("");
                setMode(mode === "sign-in" ? "sign-up" : "sign-in");
              }}
              className="inline-flex items-center gap-1 font-semibold text-[#8b7137] hover:underline"
            >
              {mode === "sign-in" ? "Create an account" : "Sign in instead"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-[14px] font-semibold text-[#52534c]">
      {label}
      <input
        {...props}
        className="mt-1.5 h-11 w-full rounded-lg border border-[#ded9cd] bg-white px-3 text-[15px] font-normal text-[#34352f] outline-none focus:border-[#bba365]"
      />
    </label>
  );
}
