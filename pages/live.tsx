'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { subscribeToLive } from '../utils/firebase';

type Live = { html?: string; lines?: string[]; title?: string; from?: string };

export default function LivePage() {
  const [live, setLive] = useState<Live | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const html = useMemo(
    () => live?.html ?? (live?.lines ? live.lines.join('<br/>') : '<div style="opacity:.5">Waiting for content…</div>'),
    [live]
  );

  // Subscribe to live content
  useEffect(() => {
    const off = subscribeToLive((v) => setLive(v));
    return () => off();
  }, []);

  // Fit content to container by scaling
  useEffect(() => {
    const fit = () => {
      const c = containerRef.current, el = contentRef.current;
      if (!c || !el) return;
      el.style.transform = 'scale(1)';           // reset
      // Wait a tick for DOM to lay out
      requestAnimationFrame(() => {
        const sw = el.scrollWidth || 1;
        const sh = el.scrollHeight || 1;
        const scaleX = c.clientWidth / sw;
        const scaleY = c.clientHeight / sh;
        const scale = Math.min(scaleX, scaleY, 1);
        el.style.transform = `scale(${scale})`;
      });
    };
    fit();

    const ro = new ResizeObserver(fit);
    if (containerRef.current) ro.observe(containerRef.current);
    if (contentRef.current)   ro.observe(contentRef.current);
    window.addEventListener('resize', fit);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [html]);

  return (
    <div className="live-root">
      <div ref={containerRef} className="stage">
        <div ref={contentRef} className="content" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      <style jsx global>{`
        html, body, #__next, .live-root { height:100%; margin:0; background:#000; color:#fff; }
        .live-root { display:flex; align-items:center; justify-content:center; }
        .stage { position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center; overflow:hidden; }
        .content {
          transform-origin: 50% 50%;
          /* sensible defaults for text-centric slides */
          font-size: 56px;
          line-height: 1.22;
          text-align: center;
        }
        .content h1, .content h2, .content h3, .content p { margin:.2em 0; }
      `}</style>
    </div>
  );
}
