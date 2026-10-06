import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FlipHorizontal,
  Upload,
  X,
  Check,
  UserCheck,
  Shield,
} from 'lucide-react';

export type PhotoCaptureSource = 'LIVE_CAMERA' | 'FILE_UPLOAD' | 'RECEPTION_ASSISTED';

interface CameraCaptureProps {
  preferredFacingMode?: 'user' | 'environment';
  title?: string;
  subtitle?: string;
  onCapture: (dataUrl: string, source: PhotoCaptureSource) => void;
  onSelectReceptionAssisted?: () => void;
  onCancel?: () => void;
}

type CameraState = 'INITIALIZING' | 'STREAMING' | 'CAPTURED' | 'ERROR';

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  preferredFacingMode = 'user',
  title = 'Arrival Photo Verification',
  subtitle = 'Front desk photo for visitor verification and badge issuance.',
  onCapture,
  onSelectReceptionAssisted,
  onCancel,
}) => {
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(preferredFacingMode);
  const [cameraState, setCameraState] = useState<CameraState>('INITIALIZING');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [captureSource, setCaptureSource] = useState<PhotoCaptureSource>('LIVE_CAMERA');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [captureTimestamp, setCaptureTimestamp] = useState<string>('');

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
      setErrorType(null);
      setCameraState('INITIALIZING');
      setIsRetrying(true);

      // Check secure context
      if (typeof window !== 'undefined' && window.isSecureContext === false && window.location.hostname !== 'localhost') {
        if (isMountedRef.current) {
          setErrorType('SecurityError');
          setErrorMessage('Camera access requires an HTTPS connection. Please access via secure URL.');
          setCameraState('ERROR');
          setIsRetrying(false);
        }
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (isMountedRef.current) {
          setErrorType('NotSupported');
          setErrorMessage('Your browser does not support camera access (getUserMedia). You can upload a photo file or select reception-assisted capture.');
          setCameraState('ERROR');
          setIsRetrying(false);
        }
        return;
      }

      // Constraints matrix
      const oppositeMode = targetMode === 'user' ? 'environment' : 'user';
      const constraintTiers: MediaStreamConstraints[] = [
        {
          video: { facingMode: { ideal: targetMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        },
        {
          video: { facingMode: targetMode },
          audio: false,
        },
        {
          video: { facingMode: { ideal: oppositeMode } },
          audio: false,
        },
        {
          video: true,
          audio: false,
        },
      ];

      let acquiredStream: MediaStream | null = null;
      let lastCaughtError: any = null;

      for (let i = 0; i < constraintTiers.length; i++) {
        try {
          acquiredStream = await navigator.mediaDevices.getUserMedia(constraintTiers[i]);
          if (acquiredStream) break;
        } catch (err: any) {
          lastCaughtError = err;
          // If explicitly denied, do not continue trying
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            break;
          }
        }
      }

      if (!acquiredStream || !isMountedRef.current) {
        if (acquiredStream) stopAllMediaTracks(acquiredStream);

        const errName = lastCaughtError?.name || 'UnknownError';
        setErrorType(errName);

        let userMsg = 'Unable to access camera.';
        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          userMsg =
            'Camera permission was denied. Please allow camera permissions in your browser or choose Reception-Assisted Capture below.';
        } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
          userMsg =
            'Camera hardware is currently busy or in use by another tab/application. Please close other camera apps and retry.';
        } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
          userMsg = 'No camera sensor was detected on this device. You can upload a photo file or request reception assistance.';
        } else if (lastCaughtError?.message) {
          userMsg = `Camera Error (${errName}): ${lastCaughtError.message}`;
        }

        if (isMountedRef.current) {
          setErrorMessage(userMsg);
          setCameraState('ERROR');
          setIsRetrying(false);
        }
        return;
      }

      currentStreamRef.current = acquiredStream;

      if (videoRef.current) {
        const video = videoRef.current;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.muted = true;
        video.autoplay = true;
        video.srcObject = acquiredStream;

        video.onloadedmetadata = () => {
          video
            .play()
            .then(() => {
              if (isMountedRef.current) {
                setCameraState('STREAMING');
                setIsRetrying(false);
              }
            })
            .catch(() => {
              if (isMountedRef.current) {
                setCameraState('STREAMING');
                setIsRetrying(false);
              }
            });
        };
      } else {
        if (isMountedRef.current) {
          setCameraState('STREAMING');
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

  // Capture snapshot from video canvas
  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (facingMode === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, width, height);

      if (facingMode === 'user') {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }

      // Add clean WCR corporate watermark
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const formattedTimestamp = `${dateStr} • ${timeStr}`;
      setCaptureTimestamp(formattedTimestamp);

      // Bottom bar
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(0, height - 36, width, 36);

      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('WCR VERIFIED ARRIVAL', 12, height - 14);

      ctx.font = '11px monospace';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(formattedTimestamp, width - ctx.measureText(formattedTimestamp).width - 12, height - 14);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPhoto(dataUrl);
      setCaptureSource('LIVE_CAMERA');
      setCameraState('CAPTURED');

      stopAllMediaTracks();
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setCaptureTimestamp('');
    initializeCamera(facingMode);
  };

  const handleToggleFacing = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
  };

  const handleFallbackFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setCapturedPhoto(result);
          setCaptureSource('FILE_UPLOAD');
          setCameraState('CAPTURED');
          setCaptureTimestamp(`Device Upload • ${new Date().toLocaleDateString('en-GB')}`);
          stopAllMediaTracks();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmReceptionAssisted = () => {
    stopAllMediaTracks();
    if (onSelectReceptionAssisted) {
      onSelectReceptionAssisted();
    } else {
      onCapture('', 'RECEPTION_ASSISTED');
    }
  };

  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      stopAllMediaTracks();
      onCapture(capturedPhoto, captureSource);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl text-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div>
          <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
            <Camera className="w-4 h-4 text-amber-600" />
            <span>{title}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={() => {
              stopAllMediaTracks();
              onCancel();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Viewport */}
      <div className="p-4 space-y-4">
        {/* Error Notice */}
        {cameraState === 'ERROR' && errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-2.5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-950">Camera Access Notice</p>
                <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-rose-200/80 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => initializeCamera(facingMode)}
                className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 font-semibold rounded-lg flex items-center gap-1.5 transition text-xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                Retry Camera
              </button>

              <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg flex items-center gap-1.5 transition text-xs cursor-pointer border border-slate-200">
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                Upload Photo File
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFallbackFileUpload}
                />
              </label>

              <button
                type="button"
                onClick={handleConfirmReceptionAssisted}
                className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded-lg flex items-center gap-1.5 transition text-xs cursor-pointer border border-amber-300"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                Reception-Assisted Capture
              </button>
            </div>
          </div>
        )}

        {/* Viewport Box */}
        <div className="relative w-full aspect-square max-h-[300px] bg-slate-900 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center shadow-inner">
          {cameraState === 'CAPTURED' && capturedPhoto ? (
            <div className="relative w-full h-full">
              <img src={capturedPhoto} alt="Captured preview" className="w-full h-full object-cover" />
              <div className="absolute top-2.5 right-2.5 bg-emerald-600 text-white font-semibold px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1 shadow">
                <CheckCircle2 className="w-3 h-3" />
                {captureSource === 'LIVE_CAMERA' ? 'Live Camera' : 'Device Upload'}
              </div>
              {captureTimestamp && (
                <div className="absolute bottom-2.5 left-2.5 bg-slate-900/80 px-2 py-0.5 rounded text-[10px] text-amber-300 font-mono">
                  {captureTimestamp}
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
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-slate-900 text-slate-300 p-4">
                  <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-medium text-slate-200">Connecting to camera hardware...</p>
                </div>
              )}

              {cameraState === 'STREAMING' && (
                <>
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 bg-slate-950/70 backdrop-blur-xs rounded-md text-[10px] font-semibold text-emerald-400 border border-slate-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE PREVIEW
                  </div>

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleToggleFacing}
                      className="p-1.5 bg-slate-950/70 hover:bg-slate-800 text-slate-200 hover:text-amber-400 rounded-lg border border-slate-700 transition cursor-pointer"
                      title="Switch Camera (Front/Rear)"
                    >
                      <FlipHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="absolute inset-8 border border-dashed border-amber-400/50 rounded-xl pointer-events-none flex items-center justify-center">
                    <span className="text-[10px] text-amber-300/80 font-medium bg-slate-950/50 px-2 py-0.5 rounded">
                      Align Face in Center
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Buttons / Controls */}
        <div>
          {cameraState === 'STREAMING' ? (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCapture}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4 text-amber-400" />
                Capture Photo
              </button>

              <button
                type="button"
                onClick={handleToggleFacing}
                className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition cursor-pointer"
                title="Switch Lens"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
            </div>
          ) : cameraState === 'CAPTURED' ? (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retake
              </button>

              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                Attach Photo
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => initializeCamera(facingMode)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                Initialize Camera
              </button>

              <button
                type="button"
                onClick={handleConfirmReceptionAssisted}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                Reception will capture photo at desk
              </button>
            </div>
          )}

          {/* Quick Upload or Reception Assistant Option */}
          {cameraState === 'STREAMING' && (
            <div className="pt-2.5 flex items-center justify-between text-[11px] text-slate-500">
              <label className="hover:text-slate-800 underline cursor-pointer">
                Upload from device instead
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFallbackFileUpload}
                />
              </label>

              <button
                type="button"
                onClick={handleConfirmReceptionAssisted}
                className="hover:text-slate-800 underline cursor-pointer"
              >
                Reception will assist
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
