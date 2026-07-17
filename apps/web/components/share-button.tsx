"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

interface ShareButtonProps {
  title: string;
  text?: string;
  className?: string;
}

export function ShareButton({ title, text, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // User dismissed the native share sheet - not an error.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail (e.g. insecure context) - nothing to
      // recover into here, the button just silently no-ops.
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={copied ? "Link copied" : "Share this listing"}
      className={
        className ??
        "flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black shadow-soft backdrop-blur transition-transform hover:scale-110 active:scale-95"
      }
    >
      {copied ? (
        <Check className="h-5 w-5 text-success" strokeWidth={2} />
      ) : (
        <Share2 className="h-5 w-5" strokeWidth={2} />
      )}
    </button>
  );
}
