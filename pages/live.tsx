// pages/live.tsx  (Next.js pages router)
// If you are on the app router, put the same code in app/live/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { subscribeToLive } from "../utils/firebase";

function toHtml(val: any): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (val.html) return String(val.html);
  if (val.data?.html) return String(val.data.html);
  return String(val);
}

export default function Live() {
  const [html, setHtml] = useState("");

  useEffect(() => {
    const off = subscribeToLive((val) => setHtml(toHtml(val)));
    // subscribeToLive returns the Firebase unsubscribe; clean up when leaving
    return () => {
      if (typeof off === "function") (off as any)();
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-[96vw] py-6">
        <div
          className="w-full aspect-video rounded-xl bg-zinc-900 ring-1 ring-zinc-800 p-6"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
