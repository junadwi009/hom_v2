"use client";

import { Mic, Paperclip, Phone, Search, Send, Smile } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  from: "them" | "me";
  text: string;
  time: string;
};

type Conversation = {
  id: string;
  name: string;
  initials: string;
  preview: string;
  time: string;
  unread: number;
  status: string;
  messages: ChatMessage[];
};

const CONVERSATIONS: Conversation[] = [
  {
    id: "sirin",
    name: "Sirin Chandra",
    initials: "SC",
    preview: "Oke, saya tunggu jadwalnya ya.",
    time: "13.05",
    unread: 2,
    status: "Aktif 5 menit lalu",
    messages: [
      { id: "m1", from: "them", text: "Halo, kelas pilates besok masih ada slot?", time: "12.40" },
      { id: "m2", from: "me", text: "Halo Sirin! Masih ada, jam 10.00 atau 16.00.", time: "12.42" },
      { id: "m3", from: "them", text: "Oke, saya tunggu jadwalnya ya.", time: "13.05" },
    ],
  },
  {
    id: "asep",
    name: "Asep Pratama",
    initials: "AP",
    preview: "Sekarang saya lagi di jalan, kenapa ya?",
    time: "13.02",
    unread: 0,
    status: "Aktif 2 menit lalu",
    messages: [
      { id: "m1", from: "them", text: "Hai, saya Asep.", time: "12.23" },
      { id: "m2", from: "me", text: "Halo Asep, ada yang bisa kami bantu?", time: "12.57" },
      { id: "m3", from: "me", text: "Apakah jadi reschedule untuk sesi hari ini?", time: "13.01" },
      { id: "m4", from: "them", text: "Sekarang saya lagi di jalan, kenapa ya?", time: "13.02" },
    ],
  },
  {
    id: "katty",
    name: "Katty Wan",
    initials: "KW",
    preview: "Bagaimana cara perpanjang paket?",
    time: "11.49",
    unread: 1,
    status: "Aktif 1 jam lalu",
    messages: [
      { id: "m1", from: "them", text: "Bagaimana cara perpanjang paket?", time: "11.49" },
    ],
  },
  {
    id: "james",
    name: "James Dharma",
    initials: "JD",
    preview: "Baik, terima kasih infonya.",
    time: "09.23",
    unread: 0,
    status: "Aktif pagi ini",
    messages: [
      { id: "m1", from: "me", text: "Sisa sesi paket Anda tinggal 2 ya.", time: "09.20" },
      { id: "m2", from: "them", text: "Baik, terima kasih infonya.", time: "09.23" },
    ],
  },
  {
    id: "natasha",
    name: "Natasha Noor",
    initials: "NN",
    preview: "OTW ke studio sekarang.",
    time: "09.12",
    unread: 2,
    status: "Aktif pagi ini",
    messages: [
      { id: "m1", from: "them", text: "OTW ke studio sekarang.", time: "09.12" },
    ],
  },
];

export function LiveChatMock() {
  const [activeId, setActiveId] = useState(CONVERSATIONS[1].id);
  const active =
    CONVERSATIONS.find((conversation) => conversation.id === activeId) ??
    CONVERSATIONS[0];

  return (
    <>
      <PageHeader
        eyebrow="Communication"
        title="Live Chat"
        description="Pratinjau antarmuka inbox percakapan. Belum terhubung ke WhatsApp; data di bawah hanya contoh."
        actions={<Badge tone="info">Demo</Badge>}
      />
      <div className="grid gap-4 overflow-hidden rounded-lg border bg-background-card lg:grid-cols-[330px_1fr]">
        <aside className="flex max-h-[640px] flex-col border-b lg:border-b-0 lg:border-r">
          <div className="border-b px-4 py-4">
            <h2 className="text-lg font-semibold text-foreground">Chats</h2>
            <label className="relative mt-3 block">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-2.5 size-4 text-foreground-muted"
              />
              <input
                aria-label="Cari percakapan"
                className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none placeholder:text-foreground-muted"
                disabled
                placeholder="Cari percakapan"
                type="search"
              />
            </label>
          </div>
          <ul className="flex-1 overflow-y-auto">
            {CONVERSATIONS.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(conversation.id)}
                  className={cn(
                    "flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-stone-50",
                    conversation.id === active.id && "bg-accent-gold-muted",
                  )}
                >
                  <Avatar initials={conversation.initials} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {conversation.name}
                      </span>
                      <span className="shrink-0 text-xs text-foreground-muted">
                        {conversation.time}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-foreground-muted">
                        {conversation.preview}
                      </span>
                      {conversation.unread > 0 ? (
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-gold)] text-[11px] font-semibold text-stone-950">
                          {conversation.unread}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="flex max-h-[640px] min-h-[480px] flex-col">
          <header className="flex items-center justify-between gap-3 border-b px-5 py-4">
            <div className="flex items-center gap-3">
              <Avatar initials={active.initials} />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {active.name}
                </p>
                <p className="text-xs text-foreground-muted">{active.status}</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Panggil (nonaktif)"
              className="rounded-md p-2 text-foreground-muted hover:bg-stone-100"
              disabled
            >
              <Phone aria-hidden="true" className="size-4" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-stone-50/60 px-5 py-5">
            <div className="flex justify-center">
              <span className="rounded-full bg-background-card px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-foreground-muted shadow-sm">
                Hari ini
              </span>
            </div>
            {active.messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.from === "me" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                    message.from === "me"
                      ? "rounded-br-sm bg-[var(--accent-gold)] text-stone-950"
                      : "rounded-bl-sm bg-background-card text-foreground",
                  )}
                >
                  <p className="leading-5">{message.text}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      message.from === "me"
                        ? "text-stone-700"
                        : "text-foreground-muted",
                    )}
                  >
                    {message.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t px-4 py-3">
            <Smile aria-hidden="true" className="size-5 text-foreground-muted" />
            <input
              aria-label="Ketik pesan (nonaktif pada pratinjau)"
              className="h-10 flex-1 rounded-full border bg-background px-4 text-sm outline-none placeholder:text-foreground-muted"
              disabled
              placeholder="Ketik pesan…"
              type="text"
            />
            <Paperclip aria-hidden="true" className="size-5 text-foreground-muted" />
            <Mic aria-hidden="true" className="size-5 text-foreground-muted" />
            <button
              type="button"
              aria-label="Kirim (nonaktif)"
              className="flex size-10 items-center justify-center rounded-full bg-[var(--accent-gold)] text-stone-950"
              disabled
            >
              <Send aria-hidden="true" className="size-4" />
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-stone-200 text-sm font-semibold text-stone-700">
      {initials}
    </span>
  );
}
