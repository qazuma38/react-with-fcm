// React - テキストとトークンを入力してGASに送信するコンポーネント
import React, { useState } from 'react';

function FCMTestSender() {
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');
  
  // GASのウェブアプリURLを設定
  const GAS_ENDPOINT = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

  // テキストデータ形式でJSONを送信する関数
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('送信中...');
    
    try {
      // メッセージとトークンをJSONオブジェクトにまとめる
      const data = {
        message: message,
        token: token
      };
      
      // JSONをテキスト（文字列）に変換
      const jsonString = JSON.stringify(data);
      
      // テキストデータとして送信
      const response = await fetch(GAS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain', // テキストデータとして送信
        },
        body: jsonString, // JSON文字列をそのまま送信
        mode: 'no-cors', // CORSエラー回避
      });
      
      setStatus('送信成功！');
    } catch (error) {
      console.error('Error:', error);
      setStatus('エラーが発生しました: ' + error.message);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">FCM通知テスト送信</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="message" className="block mb-1 font-medium">
            メッセージ:
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="送信するメッセージを入力"
            rows={4}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label htmlFor="token" className="block mb-1 font-medium">
            デバイストークン:
          </label>
          <textarea
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="送信先のデバイストークンを入力（空の場合はトピック送信）"
            rows={3}
            className="w-full p-2 border rounded"
          />
          <p className="text-sm text-gray-500 mt-1">
            ※空のままにするとトピック送信（全デバイス）になります
          </p>
        </div>
        
        <div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            送信テスト実行
          </button>
        </div>
      </form>
      
      {status && (
        <div className="mt-4 p-2 border rounded bg-gray-50">
          <p>{status}</p>
        </div>
      )}
    </div>
  );
}

export default FCMTestSender;