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
              @keyframes fpSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes fpPulse {
                0%, 100% { opacity: 0.85; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.04); }
              }
              #fp-preloader {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #000000;
                display: flex;
                flex-direction: column;
                align-items: center;
                justifyContent: center;
                z-index: 999999;
                pointer-events: none;
                transition: opacity 0.25s ease;
              }
            `,
          }}
        />
      </head>
      <body style={{ margin: 0, overflow: 'hidden', backgroundColor: '#000000' }}>
        {/* Instant Frame 0 Brand Splash Preloader */}
        <div id="fp-preloader">
          <div style={{ animation: 'fpPulse 2s ease-in-out infinite', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg width="68" height="50" viewBox="0 0 46 34" fill="none">
              <path
                d="M6.5 34 L17 13.5 C19 9 22 6 27 6 L46 6 L42.5 13.5 L27 13.5 C24 13.5 22 15 20.5 18 L12.5 34 Z"
                fill="#00E676"
              />
              <path
                d="M20 34 L26 22 C27.5 18.5 30 16 34 16 L44.5 16 L41 23.5 L34 23.5 C31.5 23.5 30 25 28.5 28 L25.5 34 Z"
                fill="#00E676"
              />
            </svg>
            <div
              style={{
                marginTop: 16,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: 22,
                fontWeight: 900,
                color: '#FFFFFF',
                fontStyle: 'italic',
                letterSpacing: -0.5,
              }}
            >
              Fit<span style={{ color: '#00E676' }}>Pulse</span>
            </div>
          </div>
          <div
            style={{
              marginTop: 24,
              width: 22,
              height: 22,
              border: '2.5px solid rgba(0, 230, 118, 0.2)',
              borderTopColor: '#00E676',
              borderRadius: '50%',
              animation: 'fpSpin 0.8s linear infinite',
            }}
          />
        </div>

        {children}
      </body>
    </html>
  );
}
