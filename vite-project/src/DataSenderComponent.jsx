// React側のコード
import React, { useState } from 'react';

function DataSenderComponent() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  
  // GASのウェブアプリURLを設定（デプロイ後に取得したURLを入れる）
  const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyp9SBtFJuPija45FB2rffvUs_Y6SIw9DhB6DRWzSGRL5bH4dz9Q9e5CFuCEAr2O3_ybg/exec';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('送信中...');
    
    try {
      // GASにPOSTリクエストを送信
      const response = await fetch(GAS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: text,
        mode: 'no-cors', // CORSエラー回避
      });
      
      // no-corsモードではレスポンスの中身は見えないので、単純に成功したと表示
      setStatus('送信成功！');
      setText('');
    } catch (error) {
      console.error('Error:', error);
      setStatus('エラーが発生しました: ' + error.message);
    }
  };

  return (
    <div>
      <h2>テキストデータをGASに送信</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="保存したいテキストを入力してください"
          rows={5}
          cols={40}
        />
        <br />
        <button type="submit">送信</button>
      </form>
      <p>{status}</p>
    </div>
  );
}

export default DataSenderComponent;