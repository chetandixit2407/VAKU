import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FlipHorizontal,
  X,
  Check,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { formatPhotoTimestamp } from '../utils/dateFormatter.ts';

export type PhotoCaptureSource = 'LIVE_CAMERA' | 'FILE_UPLOAD' | 'RECEPTION_ASSISTED';

interface CameraCaptureProps {
  preferredFacingMode?: 'user' | 'environment';
  title?: string;
  subtitle?: string;
  onCapture: (dataUrl: string, source: PhotoCaptureSource, capturedAtIso?: string) => void;
  onSelectReceptionAssisted?: () => void;
  onCancel?: () => void;
}

type CameraState = 'INITIALIZING' | 'STREAMING' | 'CAPTURED' | 'ERROR';

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  preferredFacingMode = 'user',
  title = 'Candidate Photo',
  subtitle = 'Front desk biometric verification and badge photo issuance.',
  onCapture,
  onSelectReceptionAssisted,
  onCancel,
}) => {
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(preferredFacingMode);
  const [cameraState, setCameraState] = useState<CameraState>('INITIALIZING');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedIsoTimestamp, setCapturedIsoTimestamp] = useState<string>('');
  const [captureSource, setCaptureSource] = useState<PhotoCaptureSource>('LIVE_CAMERA');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [captureDisplayTimestamp, setCaptureDisplayTimestamp] = useState<string>('');
  const [showFlash, setShowFlash] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const currentStreamRef = useRef<MediaStream | null>(null);

  // Stop media tracks cleanly
  const stopAllMediaTracks = useCallback((streamToStop?: MediaStream | null) => {
    const target = streamToStop || currentStreamRef.current;
    if (target) {
      try {
        const tracks = target.getTracks();
        tracks.forEach((track) => {
          try {
            track.stop();
            track.enabled = false;
          } catch (e) {
            console.warn('Error stopping track', e);
          }
        });
      } catch (err) {
        console.warn('Error traversing tracks', err);
      }
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch (e) {
        console.warn('Error resetting video element', e);
      }
    }
    currentStreamRef.current = null;
  }, []);

  // Multi-tier camera initialization with graceful fallback
  const initializeCamera = useCallback(
    async (targetMode: 'user' | 'environment') => {
      stopAllMediaTracks();
      setErrorMessage(null);
      setCameraState('INITIALIZING');
      setIsRetrying(true);

      if (
        typeof window !== 'undefined' &&
        window.isSecureContext === false &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
      ) {
        if (isMountedRef.current) {
          setErrorMessage('Camera access requires an HTTPS secure connection. Please access via secure URL.');
          setCameraState('ERROR');
          setIsRetrying(false);
        }
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (isMountedRef.current) {
          setErrorMessage('Your browser environment does not support device camera access (getUserMedia API unavailable).');
          setCameraState('ERROR');
          setIsRetrying(false);
        }
        return;
      }

      try {
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: targetMode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch (initialErr: any) {
          console.warn('Initial facingMode camera constraint failed, attempting fallback to basic video:', initialErr);
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        if (!isMountedRef.current) {
          stopAllMediaTracks(stream);
          return;
        }

        currentStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
            if (isMountedRef.current) {
              setCameraState('STREAMING');
            }
          } catch (playErr) {
            console.warn('Video play error, attaching onloadedmetadata listener', playErr);
            videoRef.current.onloadedmetadata = async () => {
              if (isMountedRef.current && videoRef.current) {
                try {
                  await videoRef.current.play();
                } catch (e) {
                  console.warn('Secondary video play error', e);
                }
                setCameraState('STREAMING');
              }
            };
          }
        }
      } catch (err: any) {
        console.warn('Camera stream error', err);
        let friendlyMsg = err.message || 'Unable to access device camera. Please check permissions.';
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          friendlyMsg = 'Camera permission was denied. Please allow camera permissions in your browser URL bar or device settings and retry.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          friendlyMsg = 'No video camera device detected. Please connect a webcam or enable camera hardware.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          friendlyMsg = 'The camera is currently locked or in use by another application. Please close other camera tabs and retry.';
        }
        if (isMountedRef.current) {
          setErrorMessage(friendlyMsg);
          setCameraState('ERROR');
        }
      } finally {
        if (isMountedRef.current) {
          setIsRetrying(false);
        }
      }
    },
    [stopAllMediaTracks]
  );

  useEffect(() => {
    isMountedRef.current = true;
    initializeCamera(facingMode);

    return () => {
      isMountedRef.current = false;
      stopAllMediaTracks();
    };
  }, [facingMode, initializeCamera, stopAllMediaTracks]);

  const handleToggleFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleSnapPhoto = () => {
    if (!videoRef.current || cameraState !== 'STREAMING') return;

    const video = videoRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    // Trigger flash animation
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 280);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      const isoNow = new Date().toISOString();
      setCapturedPhoto(dataUrl);
      setCaptureSource('LIVE_CAMERA');
      setCapturedIsoTimestamp(isoNow);
      setCameraState('CAPTURED');
      setCaptureDisplayTimestamp(formatPhotoTimestamp(isoNow));
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setCapturedIsoTimestamp('');
    setCaptureDisplayTimestamp('');
    setCameraState('INITIALIZING');
    initializeCamera(facingMode);
  };

  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      const recordedTimestamp = capturedIsoTimestamp || new Date().toISOString();
      stopAllMediaTracks();
      onCapture(capturedPhoto, captureSource, recordedTimestamp);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto glass-panel-elevated rounded-3xl overflow-hidden border border-white/12 shadow-2xl text-slate-100">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-white/8 flex items-center justify-between bg-white/2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
            <p className="text-[11px] text-slate-400">{subtitle}</p>
          </div>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={() => {
              stopAllMediaTracks();
              onCancel();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/6 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Viewport */}
      <div className="p-5 space-y-4">
        {/* Error Notice */}
        {cameraState === 'ERROR' && errorMessage && (
          <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl text-xs text-rose-200 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-100">Camera Access Notice</p>
                <p className="text-xs text-rose-300/90 mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-rose-500/20 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => initializeCamera(facingMode)}
                className="px-3 py-1.5 bg-rose-500/30 hover:bg-rose-500/40 text-rose-100 font-semibold rounded-xl flex items-center gap-1.5 transition text-xs cursor-pointer border border-rose-500/30"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                Retry Camera
              </button>
            </div>
          </div>
        )}

        {/* Viewport Frame with Luxury Reticle */}
        <div className="relative w-full aspect-square max-h-[320px] bg-[#05070A] rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center shadow-inner">
          {/* Capture Flash Overlay */}
          <AnimatePresence>
            {showFlash && (
              <motion.div
                initial={{ opacity: 0.9 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28 }}
                className="absolute inset-0 bg-white z-50 pointer-events-none"
              />
            )}
          </AnimatePresence>

          {cameraState === 'CAPTURED' && capturedPhoto ? (
            <div className="relative w-full h-full">
              <img
                src={capturedPhoto}
                alt="Captured live preview"
                className="w-full h-full object-cover"
              />

              {/* Luxury PHOTO VERIFIED Badge */}
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: -8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-md text-slate-950 font-black px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 shadow-xl border border-emerald-400"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>PHOTO CAPTURED</span>
              </motion.div>

              {captureDisplayTimestamp && (
                <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl text-[10px] text-amber-300 font-mono border border-white/10 flex items-center gap-1.5 shadow-lg">
                  <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Captured: {captureDisplayTimestamp}</span>
                </div>
              )}
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  facingMode === 'user' ? 'transform -scale-x-100' : ''
                } ${cameraState === 'STREAMING' ? 'opacity-100' : 'opacity-0'}`}
              />

              {cameraState === 'INITIALIZING' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#07090C] text-slate-300 p-4">
                  <div className="w-9 h-9 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-medium text-slate-300">Opening device live camera...</p>
                </div>
              )}

              {cameraState === 'STREAMING' && (
                <>
                  {/* Status Overlay */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/80 backdrop-blur-md rounded-xl text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE CAMERA FEED
                  </div>

                  {/* Switch Camera */}
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleToggleFacing}
                      className="p-2 bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-amber-400 rounded-xl border border-white/10 transition cursor-pointer backdrop-blur-md"
                      title="Switch Camera (Front/Rear)"
                    >
                      <FlipHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Corner Target Reticles */}
                  <div className="absolute inset-8 pointer-events-none flex items-center justify-center animate-reticle">
                    {/* Top Left */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-amber-400" />
                    {/* Top Right */}
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-amber-400" />
                    {/* Bottom Left */}
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-amber-400" />
                    {/* Bottom Right */}
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-amber-400" />

                    <div className="bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-full border border-amber-400/30 text-[10px] font-semibold text-amber-300 tracking-wide">
                      Align Face in Frame
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-2">
          {cameraState === 'CAPTURED' ? (
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-2.5 px-4 bg-white/6 hover:bg-white/10 text-slate-200 hover:text-white font-semibold text-xs rounded-xl border border-white/10 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Retake Photo
              </button>

              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                Confirm & Save Photo
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              {/* Shutter Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                disabled={cameraState !== 'STREAMING'}
                onClick={handleSnapPhoto}
                className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-2xl shadow-amber-500/30 ring-4 ring-white/10 disabled:opacity-40 disabled:pointer-events-none cursor-pointer group"
                title="Capture Desk Photo"
              >
                <div className="w-12 h-12 rounded-full border-2 border-slate-950/60 flex items-center justify-center group-hover:scale-95 transition-transform">
                  <Camera className="w-6 h-6 text-slate-950" />
                </div>
              </motion.button>

              <p className="text-[11px] text-slate-400 font-medium">
                Tap button to take live desk photograph
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

