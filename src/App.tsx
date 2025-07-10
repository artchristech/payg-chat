import React from 'react';
import { ChatInterface } from './components/ChatInterface';
import { SideMenu } from './components/SideMenu';

function App() {
  return (
    <div className="min-h-screen bg-gray-900">
      <ChatInterface />
      <SideMenu />
    </div>
  );
}

export default App;