import React from 'react';
import { ChatInterface } from './components/ChatInterface';
import { HuggingFaceModelsPage } from './components/HuggingFaceModelsPage';

function App() {
  const [currentView, setCurrentView] = React.useState<'chat' | 'explore'>('chat');

  const handleViewChange = (view: 'chat' | 'explore') => {
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {currentView === 'chat' ? (
        <ChatInterface onViewChange={handleViewChange} />
      ) : (
        <HuggingFaceModelsPage onBackToChat={() => handleViewChange('chat')} />
      )}
    </div>
  );
}

export default App;