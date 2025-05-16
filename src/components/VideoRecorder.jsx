import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/MediaRecorder.module.css';

const VideoRecorder = ({ onClose, onSave }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [timer, setTimer] = useState(0);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    const currentMediaRecorder = mediaRecorderRef.current;
    const currentVideoRef = videoRef.current;
    const currentTimer = timerRef.current;

    return () => {
      if (currentMediaRecorder && currentMediaRecorder.state !== 'inactive') {
        currentMediaRecorder.stop();
      }
      if (currentVideoRef && currentVideoRef.srcObject) {
        currentVideoRef.srcObject.getTracks().forEach(track => track.stop());
      }
      clearInterval(currentTimer);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm'
      });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        videoChunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        setVideoBlob(videoBlob);
        setVideoUrl(URL.createObjectURL(videoBlob));
        videoChunksRef.current = [];
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Таймер
      setTimer(0);
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    clearInterval(timerRef.current);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    if (videoBlob) {
      onSave(videoBlob);
    }
    onClose();
  };

  return (
    <div className={styles.recorderOverlay}>
      <div className={styles.recorderContainer}>
        <h3>Video Recorder</h3>
        
        <div className={styles.timer}>
          {formatTime(timer)}
        </div>
        
        <div className={styles.videoContainer}>
          {!videoUrl && (
            <video 
              ref={videoRef} 
              muted 
              autoPlay 
              className={isRecording ? styles.videoLive : styles.videoOff}
            />
          )}
          
          {videoUrl && (
            <video 
              src={videoUrl} 
              controls 
              className={styles.videoPreview}
            />
          )}
        </div>
        
        <div className={styles.controls}>
          {!isRecording && !videoUrl && (
            <button onClick={startRecording} className={styles.recordButton}>
              Start Recording
            </button>
          )}
          
          {isRecording && (
            <button onClick={stopRecording} className={styles.stopButton}>
              Stop Recording
            </button>
          )}
          
          {videoUrl && (
            <>
              <button onClick={handleSave} className={styles.saveButton}>
                Send Video
              </button>
              <button onClick={() => {
                setVideoUrl('');
                setVideoBlob(null);
              }} className={styles.retryButton}>
                Retry
              </button>
            </>
          )}
          
          <button onClick={onClose} className={styles.closeButton}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoRecorder;