const webpush = require('web-push');

const publicVapidKey = process.env.PUBLIC_VAPID_KEY || 'BCatzCjIlpC2K98QvdBL8K6lBl8If7SEFaaUkqh4jp-v5EzOvYbTHjzgaZf9Q37uqFpgMLs-i_h7E6sNuEpE4u0';
const privateVapidKey = process.env.PRIVATE_VAPID_KEY || 'pLZwFnEwTQRQfouuAxsIAjP7E1Z_o31XyAD6C6FiPVQ';

webpush.setVapidDetails('mailto:test@example.com', publicVapidKey, privateVapidKey);

const sendPushNotification = async (user, payload) => {
  if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) return;
  
  const payloadString = JSON.stringify(payload);
  
  for (const sub of user.pushSubscriptions) {
    try {
      await webpush.sendNotification(sub, payloadString);
    } catch (err) {
      console.error('Error sending push notification:', err);
      // Optional: remove invalid subscription if status is 410 (Gone)
    }
  }
};

module.exports = {
  webpush,
  sendPushNotification
};
