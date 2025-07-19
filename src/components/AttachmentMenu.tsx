import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Paperclip, Image, Mic, Square, X, Sparkles } from 'lucide-react';

interface AttachmentMenuProps {
  onImageSelect: (file: File, preview: string) => void;
  onAudioRecordingComplete: (audioBlob: Blob, audioUrl: string) => void;
  onGenerateImageClick: () => void;
}

export function AttachmentMenu({ onImageSelect, onAudioRecordingComplete, onGenerateImageClick }: AttachmentMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleImageClick = () => {
    fileInputRef.current?.click();
    setIsMenuOpen(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        onImageSelect(file, preview);
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        onAudioRecordingComplete(audioBlob, audioUrl);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        setRecordingTime(0);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setIsMenuOpen(false);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  }, [onAudioRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const handleAudioClick = () => {
    startRecording();
  };

  const handleGenerateImageClick = () => {
    onGenerateImageClick();
    setIsMenuOpen(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // If recording, show recording UI
  if (isRecording) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={stopRecording}
          className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200"
        >
          <Square className="w-3 h-3" />
        </button>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          {formatTime(recordingTime)}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="w-8 h-8 bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-400 dark:hover:bg-gray-500 hover:text-gray-800 dark:hover:text-gray-100 transition-all duration-200 flex items-center justify-center"
        title="Attach file"
      >
        <Paperclip className="w-4 h-4" />
      </button>

      {isMenuOpen && (
        <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 min-w-[120px]">
          <div className="p-1">
            <button
              onClick={handleImageClick}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              <Image className="w-4 h-4" />
              Image
            </button>
            <button
              onClick={handleAudioClick}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              <Mic className="w-4 h-4" />
              Audio
            </button>
            <button
              onClick={handleGenerateImageClick}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Generate Image
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}