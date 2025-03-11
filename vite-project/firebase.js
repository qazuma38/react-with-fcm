import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebaseコンソールから取得した設定
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// FCMトークンを取得する関数
export const requestForToken = async () => {
  try {
    // 通知許可を要求
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // FCMトークンを取得
      const currentToken = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY' // ウェブプッシュ証明書の公開鍵
      });
      
      if (currentToken) {
        console.log('FCMトークン:', currentToken);
        // バックエンドサーバーにトークンを送信するなどの処理
        return currentToken;
      } else {
        console.log('FCMトークンを取得できませんでした');
      }
    } else {
      console.log('通知の許可が得られませんでした');
    }
  } catch (err) {
    console.error('FCMトークン取得エラー:', err);
  }
};

// フォアグラウンドでの通知受信ハンドラー
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });