import { getSiteMode } from "@/lib/config/siteMode";

export default function ComingSoonPage() {
  const mode = getSiteMode();
  const showWaitlist = mode === "waitlist";

  return (
    <div className="bg-mist relative flex min-h-full items-center justify-center overflow-hidden px-6 py-20">
      <div
        className="bg-doll-mini absolute -top-24 -left-24 h-72 w-72 rounded-full opacity-20 blur-3xl"
        aria-hidden
      />
      <div
        className="bg-tech-electronics absolute top-10 -right-20 h-80 w-80 rounded-full opacity-20 blur-3xl"
        aria-hidden
      />
      <div
        className="bg-ikea-hacks absolute bottom-[-6rem] left-1/3 h-64 w-64 rounded-full opacity-20 blur-3xl"
        aria-hidden
      />

      <div className="relative flex max-w-xl flex-col items-center gap-6 text-center">
        <span className="font-display flex items-baseline gap-1 text-2xl font-bold">
          <span>3D</span>
          <span className="text-accent">PIY</span>
        </span>

        <h1 className="font-display text-3xl font-bold sm:text-5xl">
          Something new is coming.
          <br />
          <span className="text-ink/60 text-xl font-normal sm:text-2xl">
            Er komt iets moois aan.
          </span>
        </h1>

        <p className="text-ink/70 text-base sm:text-lg">
          3DPIY is an independent design studio for 3D-printable files — launching soon.
          <br />
          <span className="text-ink/60">
            3DPIY is een onafhankelijke designstudio voor 3D-printbare bestanden — binnenkort
            live.
          </span>
        </p>

        {showWaitlist && (
          <div className="border-line bg-paper mt-4 flex flex-col items-center gap-3 rounded-3xl border p-6">
            <p className="text-sm font-medium">
              Want to be first to know? Create an account now.
              <br />
              <span className="text-ink/60">Wil je als eerste weten? Maak nu een account.</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="/auth/sign-up"
                className="bg-accent inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent/90"
              >
                Create account
              </a>
              <a
                href="/auth/sign-in"
                className="border-line bg-paper inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-sm font-semibold hover:bg-mist"
              >
                Sign in
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
