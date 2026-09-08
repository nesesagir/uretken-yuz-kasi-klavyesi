import { t } from "@/lib/copy";
import type { Locale } from "@/types";
import Link from "next/link";

type Props = {
  locale: Locale;
};

export function SiteFooter({ locale }: Props) {
  const ui = t(locale);
  return (
    <footer className="no-print border-t border-slate-200 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-6">
      <p className="text-center text-sm text-slate-500">{ui.copyright}</p>
      <p className="mx-auto mt-2 max-w-2xl text-center text-xs leading-relaxed text-slate-400">
        {ui.disclaimer}
      </p>
      <p className="mt-3 text-center text-sm">
        <Link href="/gizlilik" className="text-slate-500 hover:text-slate-800 hover:underline">
          {ui.privacy}
        </Link>
      </p>
    </footer>
  );
}
