// pages/live.tsx
'use client';

import React from 'react';
import { listenLive } from '../utils/firebase';

export default function Live() {
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    const off = listenLive(setData);
    return () => off();
  }, []);

  let body: React.ReactNode = <div className="text-zinc-400">Nothing live</div>;

  if (data) {
    if (data.kind === 'slides') {
      const html = (data.slides?.[data.index!] as string) || '';
      body = <div dangerouslySetInnerHTML={{ __html: html }} />;
    } else if (data.type === 'html') {
      body = <div dangerouslySetInnerHTML={{ __html: data.content || '' }} />;
    } else if (data.type === 'text') {
      body = <div className="text-6xl">{data.content}</div>;
    } else if (data.type === 'image') {
      body = <img src={data.content} className="w-full h-[calc(100vh-2rem)] object-contain" alt="" />;
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full h-full">{body}</div>
    </div>
  );
}
