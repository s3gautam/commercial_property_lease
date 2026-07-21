"use client";

import { useMutation } from "@tanstack/react-query";
import { MessagesSquare, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { apiClient } from "@/lib/api/client";
import type { ApiChatMessage, ApiChatReply } from "@/lib/api/types";
import { toVisitErrorMessage, useBookVisitMutation, useVisitsQuery } from "@/lib/hooks/use-visits";
import { useAuthStore } from "@/lib/store/auth-store";

export function ChatWithLandlord({
  propertyId,
}: {
  propertyId: string;
  propertyTitle: string;
}) {
  const user = useAuthStore((state) => state.user);
  const visitsQuery = useVisitsQuery();
  const bookVisit = useBookVisitMutation();
  const [messages, setMessages] = useState<ApiChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = useMutation({
    mutationFn: (variables: { message: string; history: ApiChatMessage[] }) =>
      apiClient.post<ApiChatReply>(`/properties/${propertyId}/chat`, variables),
    onSuccess: (response) => {
      if (!response.data) return;
      setMessages((prev) => [...prev, { role: "landlord", content: response.data!.reply }]);

      const booking = response.data.booking;
      if (!booking) return;

      // The agent can re-mention an already-confirmed slot on a later turn
      // (e.g. the tenant just says "thanks") without asking for anything
      // new - that's a re-confirmation, not a new booking attempt, so it
      // shouldn't be sent to the backend again (which would otherwise
      // reject it as a conflict against the visit it just created).
      const alreadyBooked = (visitsQuery.data?.data ?? []).some(
        (v) =>
          v.status === "upcoming" &&
          v.property_id === propertyId &&
          v.visit_date === booking.date &&
          v.visit_time === booking.time,
      );
      if (alreadyBooked) return;

      bookVisit.mutate(
        { property_id: propertyId, visit_date: booking.date, visit_time: booking.time },
        {
          onError: async (error) => {
            // The agent already sent its confirmation text above based on
            // availability alone - it has no visibility into the tenant's
            // other visits, so a conflict can only be caught here. Follow
            // up rather than silently booking anyway.
            const message = await toVisitErrorMessage(error);
            setMessages((prev) => [
              ...prev,
              {
                role: "landlord",
                content: `Actually, hold on — ${message.charAt(0).toLowerCase()}${message.slice(1)} Want to pick a different time?`,
              },
            ]);
          },
        },
      );
    },
  });

  const handleSend = () => {
    const content = draft.trim();
    if (!content || send.isPending) return;

    setMessages((prev) => [...prev, { role: "tenant", content }]);
    setDraft("");
    send.mutate({ message: content, history: messages });
  };

  return (
    <section className="mt-6 rounded-3xl border-2 border-accent/30 bg-surface p-6 shadow-card">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-gradient text-white shadow-glow">
          <MessagesSquare className="h-4.5 w-4.5" strokeWidth={2.25} />
        </span>
        <div>
          <h2 className="font-semibold tracking-tight">Chat with Landlord AI</h2>
          <p className="text-xs text-muted-foreground">Instant answers, no digging required</p>
        </div>
      </div>

      {!user ? (
        <p className="mt-3 text-sm">
          <Link href="/login" className="text-accent underline underline-offset-4">
            Log in
          </Link>{" "}
          to chat with Landlord AI about this listing.
        </p>
      ) : (
        <div className="mt-4">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ask anything about this space — rent, amenities, nearby landmarks, move-in dates,
              or book a visit — and get an answer immediately, without scrolling through the
              listing yourself.
            </p>
          ) : (
            <div ref={scrollRef} className="flex max-h-80 flex-col gap-3 overflow-y-auto pr-1">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "tenant" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      message.role === "tenant"
                        ? "bg-accent-gradient text-white"
                        : "bg-surface-2 text-foreground"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {send.isPending && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1 rounded-2xl bg-surface-2 px-4 py-2.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          )}

          <form
            className="mt-4 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              handleSend();
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask Landlord AI anything…"
              className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none transition-shadow focus:shadow-glow"
            />
            <button
              type="submit"
              disabled={!draft.trim() || send.isPending}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-gradient text-white shadow-glow transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            >
              <Send className="h-4 w-4" strokeWidth={2} />
            </button>
          </form>

          {send.isError && (
            <p className="mt-2 text-sm text-danger">
              Couldn&apos;t send that message. Please try again.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
