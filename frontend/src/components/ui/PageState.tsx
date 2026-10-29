export function PageState({
  loading,
  error,
  empty,
}: {
  loading?: string
  error?: string | null
  empty?: string | null
}) {
  return (
    <>
      {loading ? <p className="state state-loading">{loading}</p> : null}
      {error ? <p className="state state-error">{error}</p> : null}
      {empty ? <p className="state state-empty">{empty}</p> : null}
    </>
  )
}
