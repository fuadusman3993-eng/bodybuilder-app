import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Root HTML template for Expo Router Web.
 * Renders an instant pure-CSS/SVG FitPulse brand splash preloader directly in HTML,
 * so users see the glowing logo & spinner in 30ms with ZERO black-screen wait!
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Prevent stale browser disk & offline caching of HTML */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />

        {/* Unlock W3C Client Hints for Exact Mobile Hardware Detection */}
        <meta httpEquiv="Accept-CH" content="sec-ch-ua-model, sec-ch-ua-platform, sec-ch-ua-platform-version" />
        <meta httpEquiv="Permissions-Policy" content="ch-ua-model=*, ch-ua-platform=*, ch-ua-platform-version=*" />

        {/* Client-side killer: purges stale service worker & CacheStorage */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (var i = 0; i < registrations.length; i++) { registrations[i].unregister(); }
                  });
                }
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    for (var i = 0; i < names.length; i++) { caches.delete(names[i]); }
                  });
                }
              } catch (_) {}
            `,
          }}
        />

        <ScrollViewStyleReset />

        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                height: 100%;
                width: 100%;
                margin: 0;
                padding: 0;
                background-color: #000000;
                color: #FFFFFF;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
              body { overflow: hidden; background-color: #000000; }
              #root { display: flex; flex-direction: column; background-color: #000000; }
            `,
          }}
        />
      </head>
      <body style={{ margin: 0, overflow: 'hidden', backgroundColor: '#000000' }}>
        {children}
      </body>
    </html>
  );
}
