// React/クライアント側の実装

// 1. 必要なパッケージのインストール
// npm install firebase react-firebase-hooks axios

// 2. Firebaseの設定とFirestoreへのデータ書き込み
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getMessaging, 
  getToken, 
  onMessage 
} from 'firebase/messaging';

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyCR22RHLoJf9RvBs2l0my8mPfIq6YkG2lQ",
  authDomain: "reactnotificationtest-309aa.firebaseapp.com",
  projectId: "reactnotificationtest-309aa",
  storageBucket: "reactnotificationtest-309aa.firebasestorage.app",
  messagingSenderId: "914087282514",
  appId: "1:914087282514:web:d5e2fe2d125fea61459c8b"
};

// Google App Script ウェブアプリのURL
// CORS対応のプロキシを使用
const GAS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbyp9SBtFJuPija45FB2rffvUs_Y6SIw9DhB6DRWzSGRL5bH4dz9Q9e5CFuCEAr2O3_ybg/exec';
// または
// const GAS_WEBAPP_URL = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec');

// Firebaseの初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const messaging = getMessaging(app);

// FCMトークン取得とサーバー保存用関数
const requestNotificationPermissionAndSaveToken = async (userId) => {
  try {
    // 通知許可をリクエスト
    const permission = await Notification.requestPermission();
    console.log('Notification permission result:', permission);
    
    if (permission === 'granted') {
      // 開発環境の場合は代替モードを使用
      if (useDevModeNotification()) {
        console.log('開発環境を検出しました。代替トークンを使用します。');
        const mockToken = 'dev-environment-mock-token-' + Date.now();
        
        // ユーザーIDとモックトークンをFirestoreに保存（オプション）
        if (userId) {
          try {
            await setDoc(doc(db, 'fcmTokens', userId), {
              token: mockToken,
              isDevToken: true,
              updatedAt: serverTimestamp()
            });
            console.log('Mock FCM token saved to Firestore for user:', userId);
          } catch (dbError) {
            console.error('Error saving mock token to Firestore:', dbError);
          }
        }
        
        return mockToken;
      }
      
      try {
        // 本番環境: 実際のFCMトークンを取得
        const token = await getToken(messaging, {
          vapidKey: 'BLgJ4N5y-5sa5g84_NJj9fH3lbh9RV3q7N0TSCSGRv4WEcM34s3yUmNGYoUme9muKkUo5Yyw1TRmkfuvNT_E31M', // プロジェクト設定のクラウドメッセージングからVapid Keyを取得
          serviceWorkerRegistration: await navigator.serviceWorker
            .register('/firebase-messaging-sw.js', { scope: 'firebase-cloud-messaging-push-scope' })
            .catch(err => {
              console.error('Service worker registration failed:', err);
              throw new Error('サービスワーカーの登録に失敗しました: ' + err.message);
            })
        });
        
        if (!token) {
          console.error('FCM token is null or undefined');
          return null;
        }
        
        console.log('FCM token obtained:', token);
        
        // ユーザーIDとトークンをFirestoreに保存
        if (userId) {
          await setDoc(doc(db, 'fcmTokens', userId), {
            token,
            updatedAt: serverTimestamp()
          });
          console.log('FCM token saved to Firestore for user:', userId);
        } else {
          console.warn('User ID is not provided, token not saved to Firestore');
        }
        
        return token;
      } catch (fcmError) {
        console.error('Error getting FCM token:', fcmError);
        throw fcmError;
      }
    } else {
      console.log('Notification permission denied or dismissed');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    throw error;
  }
};

// 3. 開発環境用のフォールバック通知オプション
const useDevModeNotification = () => {
  // GitHub Codespaces やその他の開発環境かどうかをチェック
  const isDevEnvironment = 
    window.location.hostname.includes('github.dev') || 
    window.location.hostname.includes('gitpod.io') || 
    window.location.hostname.includes('localhost');
  
  // 開発環境の場合はフォールバックモードを有効化
  return isDevEnvironment;
};

// 通知を受信するためのリスナー設定
const setupNotificationListener = () => {
  if (useDevModeNotification()) {
    console.log('開発環境用通知モードを使用します。サービスワーカーは使用しません。');
    return;
  }
  
  onMessage(messaging, (payload) => {
    console.log('Message received:', payload);
    
    // ブラウザ通知を表示
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: '/favicon.ico'
    };
    
    new Notification(notificationTitle, notificationOptions);
  });
};

// メッセージ送信機能を持つコンポーネント
function MessageForm({ initialCurrentUserId, initialTargetUserId }) {
  const [message, setMessage] = useState('');
  const [notificationStatus, setNotificationStatus] = useState('unknown'); // 'unknown', 'granted', 'denied', 'default'
  const [currentUserId, setCurrentUserId] = useState(initialCurrentUserId || '');
  const [targetUserId, setTargetUserId] = useState(initialTargetUserId || '');
  
  // コンポーネント初期化時に通知ステータスを確認
  useEffect(() => {
    // 通知リスナーのセットアップ
    setupNotificationListener();
    
    // 現在の通知許可状態を確認
    checkNotificationPermission();
  }, []);
  
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // targetUserIdが未定義の場合のチェック
    if (!targetUserId) {
      console.error('Error: receiverId is undefined');
      alert('受信者が指定されていません。');
      return;
    }
    
    try {
      // メッセージをFirestoreに保存
      const messageData = {
        text: message,
        senderId: currentUserId || 'anonymous', // currentUserIdが未定義の場合のフォールバック
        receiverId: targetUserId, // 上でチェック済み
        read: false,
        createdAt: serverTimestamp()
      };
      
      console.log('Saving message with data:', messageData); // デバッグログ
      
      // messagesコレクションに新しいドキュメントを追加
      const docRef = await addDoc(collection(db, 'messages'), messageData);
      const messageId = docRef.id;
      
      // Google App Scriptにリクエストを送信して通知を処理
      await triggerNotification(messageId, messageData.senderId, targetUserId, message);
      
      console.log('Message sent and notification triggered');
      
      // 入力フィールドをクリア
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert(`メッセージの送信に失敗しました: ${error.message}`);
    }
  };
  
  // Google App Scriptに通知リクエストを送信
  const triggerNotification = async (messageId, senderId, receiverId, messageText) => {
    try {
      // Google App ScriptのエンドポイントURL
      const gasUrl = 'https://script.google.com/macros/s/AKfycbyp9SBtFJuPija45FB2rffvUs_Y6SIw9DhB6DRWzSGRL5bH4dz9Q9e5CFuCEAr2O3_ybg/exec';
      
      // text/plain形式でリクエストを送信する
      const response = await fetch(gasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain' // application/jsonではなくtext/plainを使用
        },
        body: JSON.stringify({
          action: 'sendNotification',
          messageId,
          senderId,
          receiverId,
          messageText
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('GAS notification response:', data);
      return data;
    } catch (error) {
      console.error('Error triggering notification via GAS:', error);
      
      // エラー発生時もメッセージ送信は成功したことにする（Firestoreには保存済み）
      console.log('通知送信に失敗しましたが、メッセージは保存されています');
      return { success: false, error: error.toString() };
    }
  };
  
  // 通知許可状態の確認
  const checkNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      return permission;
    } catch (error) {
      console.error('通知許可状態の確認に失敗しました:', error);
      setNotificationStatus('error');
      return 'error';
    }
  };
  
  // 通知許可をリクエストするハンドラ
  const handleRequestNotification = async () => {
    // ユーザーIDが入力されているか確認
    if (!currentUserId.trim()) {
      alert('ユーザーIDを入力してください');
      return;
    }
    
    try {
      // 通知許可をリクエストしてFCMトークンを保存
      const result = await requestNotificationPermissionAndSaveToken(currentUserId);
      
      // 結果に基づいて状態を更新
      if (result) {
        setNotificationStatus('granted');
        alert('通知が許可されました。メッセージ受信時に通知が表示されます。');
        
        // ユーザー情報をFirestoreに保存
        try {
          await setDoc(doc(db, 'users', currentUserId), {
            userId: currentUserId,
            lastActive: serverTimestamp(),
            notificationEnabled: true
          }, { merge: true }); // 既存のデータがある場合はマージ
          
          console.log('ユーザー情報を保存しました:', currentUserId);
        } catch (userError) {
          console.error('ユーザー情報の保存に失敗しました:', userError);
        }
      } else {
        // 許可されなかった場合は現在の状態を再確認
        const currentPermission = await checkNotificationPermission();
        alert(currentPermission === 'denied' 
          ? '通知が拒否されました。ブラウザの設定から許可してください。' 
          : '通知の設定に失敗しました。');
      }
    } catch (error) {
      console.error('通知許可の設定に失敗しました:', error);
      alert(`エラー: ${error.message}`);
    }
  };
  
  // 通知ステータスに基づいたボタンのラベルとスタイルの設定
  const getNotificationButtonProps = () => {
    switch (notificationStatus) {
      case 'granted':
        return {
          label: '通知: 許可済み',
          style: { backgroundColor: '#4CAF50', color: 'white' },
          disabled: false
        };
      case 'denied':
        return {
          label: '通知: ブロック中',
          style: { backgroundColor: '#F44336', color: 'white' },
          disabled: false
        };
      case 'default':
        return {
          label: '通知を許可する',
          style: { backgroundColor: '#2196F3', color: 'white' },
          disabled: false
        };
      default:
        return {
          label: '通知設定を確認',
          style: { backgroundColor: '#9E9E9E', color: 'white' },
          disabled: false
        };
    }
  };
  
  const notificationBtnProps = getNotificationButtonProps();

  return (
    <div>
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            あなたのユーザーID:
          </label>
          <input
            type="text"
            value={currentUserId}
            onChange={(e) => setCurrentUserId(e.target.value)}
            placeholder="あなたのユーザーIDを入力"
            style={{ 
              width: '100%',
              padding: '8px', 
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            送信先ユーザーID:
          </label>
          <input
            type="text"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            placeholder="送信先ユーザーIDを入力"
            style={{ 
              width: '100%',
              padding: '8px', 
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          />
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <button
            type="button"
            onClick={handleRequestNotification}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              ...notificationBtnProps.style
            }}
            disabled={notificationBtnProps.disabled || !currentUserId.trim()}
          >
            {notificationBtnProps.label}
          </button>
        </div>
      </div>
      
      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="メッセージを入力..."
          style={{ 
            padding: '10px', 
            borderRadius: '4px',
            border: '1px solid #ccc',
            width: 'calc(100% - 80px)'
          }}
        />
        <button 
          type="submit"
          style={{
            padding: '10px 15px',
            backgroundColor: '#4285F4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            marginLeft: '10px',
            cursor: 'pointer'
          }}
          disabled={!currentUserId.trim() || !targetUserId.trim()}
        >
          送信
        </button>
      </form>
    </div>
  );
}

export default MessageForm;