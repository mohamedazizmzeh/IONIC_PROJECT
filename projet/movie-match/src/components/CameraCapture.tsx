import { useEffect, useRef, useState } from 'react';
import { useIonViewWillLeave } from '@ionic/react';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraDirection, EncodingType } from '@capacitor/camera';

interface CameraProps {
  photo: string;
  onPhoto: (photo: string) => void;
  onError: (error: string) => void;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
}

export default function CameraCapture({
  photo,
  onPhoto,
  onError,
  disabled,
  onBusyChange
}: CameraProps) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const request = useRef(0);
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(false);
  useEffect(() => {
    onBusyChange(open || opening);
  }, [open, opening, onBusyChange]);

  useEffect(
    () => () => {
      ++request.current;
      stream.current?.getTracks().forEach((track) => track.stop());
    },
    []
  );
  useIonViewWillLeave(() => closeCamera());

  function closeCamera() {
    ++request.current;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    setOpen(false);
    setOpening(false);
  }

  async function openCamera() {
    if (open || opening || disabled) return;
    onError('');
    setOpening(true);
    const currentRequest = ++request.current;
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await Camera.takePhoto({
          quality: 70,
          targetWidth: 300,
          targetHeight: 300,
          encodingType: EncodingType.JPEG,
          cameraDirection: CameraDirection.Front,
          saveToGallery: false,
          editable: 'no'
        });
        if (currentRequest !== request.current) return;
        if (!result.thumbnail) throw new Error('Photo indisponible');
        onPhoto(
          result.thumbnail.startsWith('data:')
            ? result.thumbnail
            : `data:image/jpeg;base64,${result.thumbnail}`
        );
      } else {
        if (!navigator.mediaDevices?.getUserMedia) {
          onError(
            'Caméra indisponible. Ouvre cette page en HTTPS ou sur localhost, avec un appareil équipé d’une caméra.'
          );
          return;
        }
        const captured = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
          audio: false
        });
        if (currentRequest !== request.current) {
          captured.getTracks().forEach((track) => track.stop());
          return;
        }
        stream.current = captured;
        setOpen(true);
        if (video.current) {
          video.current.srcObject = captured;
          await video.current.play();
        }
      }
    } catch (error) {
      if (currentRequest !== request.current) return;
      closeCamera();
      if (!/cancel/i.test(error instanceof Error ? error.message : String(error))) {
        onError(
          'Impossible d’ouvrir la caméra. Autorise son accès et vérifie qu’elle est disponible.'
        );
      }
    } finally {
      if (currentRequest === request.current) setOpening(false);
    }
  }

  function capturePhoto() {
    const preview = video.current;
    if (!open || !preview?.videoWidth || !preview.videoHeight) return;
    const scale = Math.min(1, 300 / Math.max(preview.videoWidth, preview.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(preview.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(preview.videoHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) {
      onError('Impossible de prendre la photo. Réessaie avec un autre navigateur.');
      closeCamera();
      return;
    }
    context.drawImage(preview, 0, 0, canvas.width, canvas.height);
    onPhoto(canvas.toDataURL('image/jpeg', 0.7));
    closeCamera();
  }

  return (
    <>
      <div className="photo-picker">
        {photo && <img src={photo} alt="Aperçu de ta photo de profil" />}
        <div>
          <p className="photo-label">Ta photo de profil</p>
          <button
            className="camera-button"
            type="button"
            onClick={openCamera}
            disabled={opening || open || disabled}
          >
            {opening
              ? 'Ouverture de la caméra…'
              : photo
                ? 'Reprendre la photo'
                : 'Prendre une photo'}
          </button>
          <p className="photo-hint">Une photo prise avec ta caméra est obligatoire.</p>
        </div>
      </div>
      <section className="camera-capture" hidden={!open} aria-label="Prise de photo">
        <video ref={video} autoPlay muted playsInline aria-label="Aperçu de la caméra" />
        <div className="camera-actions">
          <button type="button" className="camera-button" onClick={capturePhoto} disabled={opening}>
            Capturer la photo
          </button>
          <button type="button" className="camera-button camera-cancel" onClick={closeCamera}>
            Annuler
          </button>
        </div>
      </section>
    </>
  );
}
