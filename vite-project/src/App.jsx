import React, { useEffect, useState } from 'react';
import MessageForm from './MessageForm';
import DataSenderComponent from './DataSenderComponent';

function App() {
 
  return (
    <div className="App">
      <header className="App-header">
        <h1>Firebase Cloud Messagingのデモ</h1>
      </header>
      V0326
      <DataSenderComponent />
      <MessageForm currentUserId={"0002580"} targetUserId={"0002580"} />

    </div>
  );
}

export default App;