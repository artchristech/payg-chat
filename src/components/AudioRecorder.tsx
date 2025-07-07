import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, audioUrl: string) => void;
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
        onRecordingComplete(audioBlob, audioUrl);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        setRecordingTime(0);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  }, [onRecordingComplete]);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      {isRecording ? (
        <>
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 hover:shadow-md hover:scale-105 transition-all duration-200"
          >
            <Square className="w-4 h-4" />
            Stop
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            {formatTime(recordingTime)}
          </div>
        </>
      ) : (
        <button
          onClick={startRecording}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-gray-100 rounded-lg hover:bg-gray-700 hover:shadow-md hover:scale-105 transition-all duration-200"
          title="Record audio"
        >
          <Mic className="w-4 h-4" />
          Record
        </button>
      )}
    </div>
  );
}