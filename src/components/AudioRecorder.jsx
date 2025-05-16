import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from '../styles/MediaRecorder.module.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AudioRecorder = ({ onClose, onSave }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [timer, setTimer] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
    mediaRecorderRef.current?.stream?.getTracks().forEach(track => track.stop());
    clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        audioChunksRef.current = [];
      };
      
      mediaRecorder.start(100); // Захватываем данные каждые 100мс
      setIsRecording(true);
      
      setTimer(0);
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Microphone access denied');
    }
  }, []);

  const stopRecording = useCallback(() => {
    cleanup();
    setIsRecording(false);
  }, [cleanup]);

  const handleSave = useCallback(() => {
    if (audioBlob) {
      try {
        onSave(audioBlob);
      } catch (error) {
        console.error('Error saving audio:', error);
        toast.error('Failed to save audio');
      }
    }
    onClose();
  }, [audioBlob, onClose, onSave]);

  const handleRetry = useCallback(() => {
    setAudioUrl('');
    setAudioBlob(null);
  }, []);

  return (
    <div className={styles.recorderOverlay} role="dialog" aria-labelledby="audioRecorderTitle">
      <div className={styles.recorderContainer}>
        <h3 id="audioRecorderTitle">Audio Recorder</h3>
        
        <div className={styles.timer} aria-live="polite">
          {formatTime(timer)}
        </div>
        
        {audioUrl ? (
          <audio 
            controls 
            src={audioUrl} 
            className={styles.audioPreview} 
            aria-label="Recorded audio preview"
          />
        ) : (
          <div className={styles.placeholder} aria-live="polite">
            {isRecording ? 'Recording...' : 'Press start to record'}
          </div>
        )}
        
        <div className={styles.controls}>
          {!isRecording && !audioUrl && (
            <button 
              onClick={startRecording} 
              className={styles.recordButton}
              aria-label="Start recording"
            >
              Start Recording
            </button>
          )}
          
          {isRecording && (
            <button 
              onClick={stopRecording} 
              className={styles.stopButton}
              aria-label="Stop recording"
            >
              Stop Recording
            </button>
          )}
          
          {audioUrl && (
            <>
              <button 
                onClick={handleSave} 
                className={styles.saveButton}
                aria-label="Send audio"
              >
                Send Audio
              </button>
              <button 
                onClick={handleRetry} 
                className={styles.retryButton}
                aria-label="Retry recording"
              >
                Retry
              </button>
            </>
          )}
          
          <button 
            onClick={onClose} 
            className={styles.closeButton}
            aria-label="Close recorder"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AudioRecorder);