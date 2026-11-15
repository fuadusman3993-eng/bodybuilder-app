import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Root HTML template for Expo Router Web.
 * Sets CSS variables from localStorage BEFORE first paint to guarantee zero theme flash.
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

        {/* Zero-flash instant theme script: runs BEFORE first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var raw = localStorage.getItem('fitpulse-theme-storage');
                  var bg = '#0A0A0A', text = '#FFFFFF', primary = '#00E676';
                  if (raw) {
                    var parsed = JSON.parse(raw);
                    var themeId = parsed && parsed.state && parsed.state.activeThemeId;
                    if (themeId === 'day')        { bg = '#F1F5F9'; text = '#0F172A'; primary = '#2AABEE'; }
                    else if (themeId === 'tinted'){ bg = '#0F172A'; text = '#F8FAFC'; primary = '#38BDF8'; }
                    else if (themeId === 'night') { bg = '#000000'; text = '#FFFFFF'; primary = '#FDBF2D'; }
                    else if (themeId === 'azure') { bg = '#001C30'; text = '#FFFFFF'; primary = '#ADDFF1'; }
                    else if (themeId === 'cyber_gold')  { bg = '#000000'; text = '#FFFFFF'; primary = '#FDBF2D'; }
                    else if (themeId === 'royal_navy')  { bg = '#000033'; text = '#FFFFFF'; primary = '#FFFF99'; }
                  }
                  var r = document.documentElement;
                  r.style.setProperty('--fp-bg', bg);
                  r.style.setProperty('--fp-text', text);
                  r.style.setProperty('--fp-primary', primary);
                  r.style.backgroundColor = bg;
                  document.head.insertAdjacentHTML('beforeend',
                    '<style id="fp-flash">html,body,#root{background-color:' + bg + '!important;color:' + text + '!important}</style>'
                  );
                } catch(_) {}
              })();
            `,
          }}
        />

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
                background-color: var(--fp-bg, #0A0A0A);
                color: var(--fp-text, #FFFFFF);
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
              body { overflow: hidden; }
              #root { display: flex; flex-direction: column; }
              @keyframes fpPulseSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `,
          }}
        />
      </head>
      <body style={{ margin: 0, overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  );
}
