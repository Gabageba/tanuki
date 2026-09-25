// Заглушка для PageLayout без запроса: хук вызывается всегда, чтобы не нарушать rules-of-hooks.
function useNoQuery(): null {
  return null;
}

export default useNoQuery;
