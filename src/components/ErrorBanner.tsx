export default function ErrorBanner({ message, showPrefix = true }: { message: string; showPrefix?: boolean }) {
  return (
    <div className="error-banner" role="alert">
      {showPrefix ? `Something went wrong computing this problem: ${message}` : message}
    </div>
  )
}
