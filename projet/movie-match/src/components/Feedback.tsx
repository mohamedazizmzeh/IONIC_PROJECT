import { IonSpinner } from '@ionic/react';

export function Loading({ text = 'Chargement...' }: { text?: string }) {
  return (
    <div className="loader" role="status">
      <IonSpinner name="crescent" />
      <p>{text}</p>
    </div>
  );
}

export function RequestError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  if (!message) return null;
  return (
    <div className="request-error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Réessayer
        </button>
      )}
    </div>
  );
}
