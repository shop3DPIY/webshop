"use client";

import { useOptimistic, useTransition } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { toggleRequestVote } from "@/lib/requests/actions";

/** 👍 + count. Signed-out visitors are sent to sign in first. */
export function VoteButton({
  requestId,
  votes,
  voted,
  signedIn,
  disabled,
}: {
  requestId: string;
  votes: number;
  voted: boolean;
  signedIn: boolean;
  /** Done requests show their count but can't be voted on */
  disabled?: boolean;
}) {
  const t = useTranslations("requests");
  const router = useRouter();
  // Without the /nl prefix — the locale-aware router adds it back.
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [state, setState] = useOptimistic({ votes, voted });

  return (
    <button
      type="button"
      disabled={pending || disabled}
      aria-pressed={state.voted}
      title={signedIn ? (state.voted ? t("unvote") : t("vote")) : t("signInToVote")}
      onClick={() => {
        if (!signedIn) {
          router.push(`/auth/sign-in?next=${encodeURIComponent(pathname)}`);
          return;
        }
        start(async () => {
          setState({
            votes: state.votes + (state.voted ? -1 : 1),
            voted: !state.voted,
          });
          await toggleRequestVote(requestId);
          router.refresh();
        });
      }}
      className={`flex min-w-16 shrink-0 flex-col items-center rounded-2xl border px-3 py-2 text-sm font-bold transition-colors disabled:cursor-default ${
        state.voted
          ? "border-brand-purple bg-brand-purple/45 text-ink"
          : "border-line bg-paper hover:bg-mist"
      }`}
    >
      <span aria-hidden>👍</span>
      <span>{state.votes}</span>
      <span className="sr-only">{t("votesLabel")}</span>
    </button>
  );
}
