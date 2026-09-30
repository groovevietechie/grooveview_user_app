"use client"

import { ArrowRightIcon, SparklesIcon, XMarkIcon } from "@heroicons/react/24/outline"

interface ExperiencePromptPopupProps {
  eyebrow: string
  title: string
  subtitle: string
  supportingText: string
  actionLabel: string
  onClose: () => void
  onConfirm: () => void
  themeColor?: string
}

export default function ExperiencePromptPopup({
  eyebrow,
  title,
  subtitle,
  supportingText,
  actionLabel,
  onClose,
  onConfirm,
  themeColor = "#f6c945",
}: ExperiencePromptPopupProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-transparent p-4">
      <div
        role="dialog"
        aria-labelledby="experience-prompt-title"
        className="pointer-events-auto relative w-full max-w-[380px] overflow-hidden rounded-[22px] border border-white/15 bg-[#071326]/90 p-5 text-white shadow-2xl backdrop-blur-xl animate-scale-in sm:p-6"
        style={{ boxShadow: `0 18px 55px rgba(0, 0, 0, .42), 0 0 0 1px ${themeColor}26` }}
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full opacity-30 blur-3xl" style={{ backgroundColor: themeColor }} />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-44 w-44 rounded-full bg-blue-500/30 blur-3xl" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close prompt"
          className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-white/10 p-2 text-white/70 transition hover:bg-white/20 hover:text-white"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="relative z-10">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/20 bg-white/10" style={{ color: themeColor }}>
              <SparklesIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.22em]" style={{ color: themeColor }}>{eyebrow}</p>
              <p className="mt-1 text-xs text-white/50">A thoughtful nudge from GrooveVie</p>
            </div>
          </div>

          <h2 id="experience-prompt-title" className="max-w-[18rem] text-2xl font-semibold leading-[1.08] tracking-tight">{title}</h2>
          <p className="mt-2 text-sm font-medium text-white/85">{subtitle}</p>
          <p className="mt-1 max-w-sm text-xs leading-5 text-white/55">{supportingText}</p>

          <div className="mt-5 flex items-center gap-2">
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-xs font-bold transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
              style={{ backgroundColor: themeColor, color: "#10151f" }}
            >
              {actionLabel}
              <ArrowRightIcon className="h-4 w-4" />
            </button>
            <button type="button" onClick={onClose} className="rounded-full px-3 py-3 text-xs font-semibold text-white/55 transition hover:bg-white/10 hover:text-white">
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
