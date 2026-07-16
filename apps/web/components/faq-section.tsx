"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

const FAQS = [
  {
    question: "How does AI verification work?",
    answer:
      "Every listing can be run through our VerificationAgent, which analyzes the property details and generates a plain-language risk summary with a risk score — before you ever schedule a visit.",
  },
  {
    question: "Is there a fee to browse or search listings?",
    answer:
      "No. Browsing, AI search, and verification reports are free for tenants. Leasing fees, if any, are disclosed upfront on each listing.",
  },
  {
    question: "How do I sign in?",
    answer:
      "Use Google Sign-In for one-click access, or request a one-time code by email — no password required either way.",
  },
  {
    question: "Can I message a landlord directly?",
    answer:
      "Direct messaging is coming soon. In the meantime, verification reports and AI-drafted lease summaries give you most of what you'd normally ask a landlord upfront.",
  },
  {
    question: "What documents do I need for KYC?",
    answer:
      "Typically a government-issued ID and business registration documents. The KYC flow will walk you through exactly what's required for your business type.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">Frequently asked questions</h2>
        <p className="mt-2 text-muted-foreground">Everything you need to know before you get started.</p>
      </div>

      <div className="flex flex-col gap-3">
        {FAQS.map((faq, index) => {
          const open = openIndex === index;
          return (
            <div
              key={faq.question}
              className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-sm font-medium">{faq.question}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                  strokeWidth={2}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
