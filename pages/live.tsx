// pages/live.tsx
'use client';
import React from 'react';
import { listenLive } from '../utils/firebase';

type Payload =
  | { type: 'html'; content: string }
  | { type: 'text'; content: string }
  | { type: 'image'; content: string }
  | { type: 'slides'; slides: string[]; index: number }
  | null;

export default function LivePage() {
  const [data, setData] = React.useState<Payload>(null);

  React.useEffect(() => {
    const off = listenLive(setData);
    return () => off();
  }, []);

  let body: React.ReactNode = (
    <div className="text-zinc-500">Nothing live</div>
  );

  if (data) {
    switch (data.type) {
      case 'text':
        body = (
          <div className="text-white text-7xl font-semibold text-center">
            {data.content}
          </div>
        );
        break;
      case 'html':
        body = (
          <div
            className="text-white text-center"
            dangerouslySetInnerHTML={{ __html: data.content }}
          />
        );
        break;
      case 'image':
        body = (
          <img
            src={data.content}
            className="max-w-full max-h-full object-contain"
            alt=""
          />
        );
        break;
      case 'slides':
        body = (
          <div
            className="text-white text-center"
            dangerouslySetInnerHTML={{
              __html: data.slides?.[data.index ?? 0] || '',
            }}
          />
        );
        break;
      default:
        body = (
          <pre className="text-xs opacity-75">
            {JSON.stringify(data, null, 2)}
          </pre>
        );
    }
  }

  return (
    <div className="w-screen h-screen bg-black p-8 flex items-center justify-center">
      {body}
    </div>
  );
}
