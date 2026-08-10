export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="error-banner" role="alert">
      Something went wrong computing this problem: {message}
    </div>
  )
}
