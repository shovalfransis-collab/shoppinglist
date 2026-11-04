"use client";

import { useEffect, useRef } from "react";
import { useT } from "@/lib/i18n";

// A pop-up that asks "are you sure?". Built on the native <dialog> element, which gives us the
// dimmed backdrop, focus trapping and the Escape key for free.
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault(); // we close it ourselves through `open`
        onCancel();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onCancel(); // click on the dimmed backdrop
      }}
      aria-labelledby="confirm-title"
      className="m-auto w-[min(calc(100vw-2rem),24rem)] rounded-2xl border border-line bg-surface p-6 text-ink backdrop:bg-black/60"
    >
      <h2 id="confirm-title" className="font-display text-2xl leading-tight font-bold">
        {title}
      </h2>
      <p className="mt-2 text-muted">{body}</p>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          autoFocus
          className="min-h-12 rounded-lg border border-line px-5 font-bold"
        >
          {t.cancel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="min-h-12 rounded-lg bg-danger px-5 font-bold text-white"
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
