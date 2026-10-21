import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Root HTML template for Expo Router Web.
 * Guarantees a deep dark background (#050B0E) from the very first millisecond,
 * completely eliminating white flashes and blank white screens while scripts load.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en" style={{ backgroundColor: '#050B0E' }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#050B0E" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        <ScrollViewStyleReset />

        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                height: 100%;
                width: 100%;
                margin: 0;
                padding: 0;
                background-color: #050B0E !important;
                color: #FFFFFF !important;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
              body {
                overflow: hidden;
                background-color: #050B0E !important;
              }
              #root {
                display: flex;
                flex-direction: column;
                background-color: #050B0E !important;
              }
              /* Clean instant loading animation before React hydrates */
              @keyframes fpPulseSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .fp-initial-loader {
                position: fixed;
                inset: 0;
                background-color: #050B0E;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              }
              .fp-initial-spinner {
                width: 34px;
                height: 34px;
                border: 3px solid rgba(0, 230, 118, 0.18);
                border-top-color: #00E676;
                border-radius: 50%;
                animation: fpPulseSpin 0.75s linear infinite;
                margin-top: 18px;
              }
            `,
          }}
        />
      </head>
      <body style={{ backgroundColor: '#050B0E', margin: 0, overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  );
}
