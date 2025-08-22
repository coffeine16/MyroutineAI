export const canUseNotifications = () => {
  return "Notification" in window;
};

export const requestNotificationPermission = async () => {
  if (!canUseNotifications()) return 'unsupported';
  
  const permission = await Notification.requestPermission();
  return permission; // 'granted', 'denied', or 'default'
};

export const showNotification = (title, options = {}) => {
  if (!canUseNotifications() || Notification.permission !== 'granted') {
    return;
  }
  
  const notificationOptions = {
    body: options.body || '',
    icon: options.icon || '/favicon.ico', // A default icon
    ...options,
  };

  new Notification(title, notificationOptions);
};