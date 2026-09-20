/** Banner de error con acciones opcionales de reintento y cierre. */
export default function ErrorBanner({ message, onRetry, onClose, retryLabel = 'Reintentar' }) {
  if (!message) return null
  return (
    <div className="banner error" role="alert">
      <span>{message}</span>
      <div className="banner-actions">
        {onRetry && (
          <button type="button" className="btn" onClick={onRetry}>
            {retryLabel}
          </button>
        )}
        {onClose && (
          <button type="button" className="btn ghost" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
