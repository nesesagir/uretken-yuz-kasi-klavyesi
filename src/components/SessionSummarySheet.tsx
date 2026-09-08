"use client";

import { t } from "@/lib/copy";
import type { SessionSummary } from "@/lib/session-summary";
import type { Locale } from "@/types";
import { FileText } from "lucide-react";

type Props = {
  locale: Locale;
  summary: SessionSummary;
};

function printSummary(title: string): void {
  const previous = document.title;
  document.title = title;
  const restore = () => {
    document.title = previous;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.print();
}

export function SessionSummarySheet({ locale, summary }: Props) {
  const ui = t(locale);
  return (
    <section className="print-sheet mt-6 border-t border-slate-200 pt-6">
      <h2 className="text-[13px] font-semibold text-slate-900">{ui.summaryTitle}</h2>
      <div className="no-print mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">{ui.summaryFileLabel}</p>
          <p className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800">
            <FileText className="size-4 shrink-0 text-teal-700" strokeWidth={1.75} aria-hidden="true" />
            <span className="min-w-0 break-words">{summary.printTitle}</span>
          </p>
        </div>
        <button
          type="button"
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() => printSummary(summary.printTitle)}
        >
          {ui.summaryPrint}
        </button>
      </div>
      <p className="mt-1 hidden text-sm font-medium text-slate-900 print:block">{ui.product}</p>
      <dl className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">{ui.summaryDate}</dt>
          <dd className="font-medium text-slate-900">{summary.dateLabel}</dd>
        </div>
        <div>
          <dt className="text-slate-500">{ui.userNameLabel}</dt>
          <dd className="font-medium text-slate-900">{summary.userName || "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">{ui.caregiverNameLabel}</dt>
          <dd className="font-medium text-slate-900">{summary.caregiverName || "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">{ui.caregiverPhoneLabel}</dt>
          <dd className="font-medium text-slate-900">{summary.caregiverPhone || "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">{ui.triggerLabel}</dt>
          <dd className="font-medium text-slate-900">{summary.trigger}</dd>
        </div>
        <div>
          <dt className="text-slate-500">{ui.scanLabel}</dt>
          <dd className="font-medium text-slate-900">
            {summary.scanSec} {ui.scanUnit}
          </dd>
        </div>
      </dl>
      <ul className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <li className="rounded-lg border border-slate-200 px-3 py-2">
          <p className="m-0 text-xs text-slate-500">{ui.careSentences}</p>
          <p className="m-0 text-lg font-semibold tabular-nums">{summary.sentences}</p>
        </li>
        <li className="rounded-lg border border-slate-200 px-3 py-2">
          <p className="m-0 text-xs text-slate-500">{ui.careKindSos}</p>
          <p className="m-0 text-lg font-semibold tabular-nums">{summary.sos}</p>
        </li>
        <li className="rounded-lg border border-slate-200 px-3 py-2">
          <p className="m-0 text-xs text-slate-500">{ui.careKindAlarm}</p>
          <p className="m-0 text-lg font-semibold tabular-nums">{summary.alarms}</p>
        </li>
        <li className="rounded-lg border border-slate-200 px-3 py-2">
          <p className="m-0 text-xs text-slate-500">{ui.careKindNote}</p>
          <p className="m-0 text-lg font-semibold tabular-nums">{summary.notes}</p>
        </li>
      </ul>
      {summary.lines.length ? (
        <ol className="mt-4 grid gap-1 text-sm text-slate-800">
          {summary.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 text-sm text-slate-500">{ui.careEmpty}</p>
      )}
      <p className="mt-6 text-xs leading-relaxed text-slate-400">{ui.disclaimer}</p>
    </section>
  );
}
