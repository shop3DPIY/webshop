import Image from "next/image";
import { Quicksand } from "next/font/google";
import { getSiteMode } from "@/lib/config/siteMode";

const quicksand = Quicksand({ subsets: ["latin"], weight: "700" });

export default function ComingSoonPage() {
  const mode = getSiteMode();
  const showWaitlist = mode === "waitlist";

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <Image
        src="/images/banner/Banner_3DPIY.png"
        alt=""
        fill
        priority
        className="object-cover"
        aria-hidden
      />

      <div className="relative flex h-full w-full flex-col items-center justify-center gap-6 px-6">
        <div className="flex min-h-[20vh] w-full max-w-3xl flex-col items-center justify-center gap-4 rounded-3xl px-8 py-6 text-center glass">
          <Image
            src="/images/logo/Logo_3DPIY_v2-transparent.png"
            alt="3DPIY"
            width={345}
            height={237}
            priority
            className="h-28 w-auto sm:h-36"
          />

          <h1 className={`${quicksand.className} text-3xl text-white sm:text-5xl`}>
            Something new is coming
            <span className="text-[#ff66c4] text-4xl sm:text-6xl">.</span>
          </h1>
        </div>

        {showWaitlist && (
          <div className="flex flex-col items-center gap-3 rounded-3xl p-6 text-center glass">
            <p className="text-sm font-medium">Want to be first to know? Create an account now.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="/auth/sign-up"
                className="border border-action bg-action text-on-action hover:border-action-hover-border hover:bg-action-hover hover:text-on-action-hover backdrop-blur-lg transition-colors inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold"
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
