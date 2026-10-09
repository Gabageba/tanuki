import useNotificationsStream from './hooks/useNotificationsStream';

/**
 * Держит поток SSE на всех страницах за входом — и в читалке, которая живёт вне `Layout`: воркер
 * глушит push при видимой вкладке, так что тост в ней — единственное, что человек увидит.
 */
function NotificationsStream() {
  useNotificationsStream();
  return null;
}

export default NotificationsStream;
