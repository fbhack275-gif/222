import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

// Global safeguard against browser "play() request was interrupted because the media was removed from the document"
if (typeof window !== 'undefined') {
  if (window.HTMLMediaElement && window.HTMLMediaElement.prototype) {
    const originalPlay = window.HTMLMediaElement.prototype.play;
    window.HTMLMediaElement.prototype.play = function (...args) {
      try {
        const playPromise = originalPlay.apply(this, args);
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch((err: any) => {
            const msg = String(err?.message || '');
            if (
              err?.name === 'AbortError' ||
              err?.name === 'NotAllowedError' ||
              msg.includes('interrupted') ||
              msg.includes('removed from the document')
            ) {
              // Benign browser interruption when video/audio element is unmounted or modal is closed
              return;
            }
            console.warn('Media play interrupted or blocked:', err);
          });
        }
        return playPromise;
      } catch (err: any) {
        const msg = String(err?.message || '');
        if (
          err?.name === 'AbortError' ||
          err?.name === 'NotAllowedError' ||
          msg.includes('interrupted') ||
          msg.includes('removed from the document')
        ) {
          return Promise.resolve();
        }
        return Promise.reject(err);
      }
    };
  }

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = String(reason?.message || reason || '');
    if (
      reason?.name === 'AbortError' ||
      msg.includes('interrupted because the media was removed') ||
      msg.includes('The play() request was interrupted')
    ) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

