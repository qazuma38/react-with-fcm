// firebase-messaging-sw.js
// このファイルをプロジェクトのpublicディレクトリ（または静的ファイルが配信されるルートディレクトリ）に配置してください

// Firebase App (必須) と必要なモジュールのインポート
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Firebaseの初期化
firebase.initializeApp({
    apiKey: "AIzaSyCR22RHLoJf9RvBs2l0my8mPfIq6YkG2lQ",
    authDomain: "reactnotificationtest-309aa.firebaseapp.com",
    projectId: "reactnotificationtest-309aa",
    storageBucket: "reactnotificationtest-309aa.firebasestorage.app",
    messagingSenderId: "914087282514",
    appId: "1:914087282514:web:d5e2fe2d125fea61459c8b"
});

// Firebase Cloud Messagingオブジェクトを取得
const messaging = firebase.messaging();

// バックグラウンドメッセージの処理
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title || 'New Message';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: '/favicon.ico',
    // バッジ、タグ、データなど、その他の通知オプションを設定可能
  };

  // 通知を表示
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// プッシュ通知がクリックされたときの処理
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked: ', event);
  // 通知を閉じる
  event.notification.close();

  // クリックアクションの処理
  const clickAction = event.notification.data?.FCM_MSG?.notification?.click_action;
  if (clickAction) {
    // 特定のURLを開くなどの処理
    clients.openWindow(clickAction);
  } else {
    // デフォルトではアプリを開く
    clients.openWindow('/');
  }
});