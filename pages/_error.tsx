// pages/_error.tsx
import React from 'react';

export default function ErrorPage({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>Something went wrong</h1>
      {statusCode ? <p>Server error {statusCode}</p> : <p>Client error</p>}
      <p>Check the browser console for the top stack frame that points into your code.</p>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};
