import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import CameraCapture from './CameraCapture';

vi.mock('@capacitor/camera', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@capacitor/camera')>()),
  Camera: { takePhoto: vi.fn() }
}));

function mount() {
  const onPhoto = vi.fn();
  const onError = vi.fn();
  const onBusyChange = vi.fn();
  const view = render(
    <CameraCapture
      photo=""
      onPhoto={onPhoto}
      onError={onError}
      disabled={false}
      onBusyChange={onBusyChange}
    />
  );
  return { ...view, onPhoto, onError, onBusyChange };
}

it('opens a live browser camera, captures JPEG, and releases the stream', async () => {
  vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
  const stop = vi.fn();
  const stream = { getTracks: () => [{ stop }] };
  const getUserMedia = vi.fn().mockResolvedValue(stream);
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: vi.fn()
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
    'data:image/jpeg;base64,captured'
  );
  const { onPhoto, onBusyChange, container } = mount();
  fireEvent.click(screen.getByRole('button', { name: 'Prendre une photo' }));
  await waitFor(() => expect(onBusyChange).toHaveBeenLastCalledWith(true));
  expect(getUserMedia).toHaveBeenCalledWith(expect.objectContaining({ audio: false }));
  const video = container.querySelector('video')!;
  Object.defineProperties(video, { videoWidth: { value: 640 }, videoHeight: { value: 480 } });
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Capturer la photo' })).toBeEnabled()
  );
  fireEvent.click(screen.getByRole('button', { name: 'Capturer la photo' }));
  expect(onPhoto).toHaveBeenCalledWith('data:image/jpeg;base64,captured');
  expect(stop).toHaveBeenCalledOnce();
  expect(container.querySelector('input[type=file]')).toBeNull();
});

it('releases a late camera stream after leaving registration', async () => {
  vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
  let resolve!: (stream: unknown) => void;
  const stop = vi.fn();
  vi.stubGlobal('navigator', {
    mediaDevices: {
      getUserMedia: () =>
        new Promise((done) => {
          resolve = done;
        })
    }
  });
  const { unmount, onPhoto } = mount();
  fireEvent.click(screen.getByRole('button', { name: 'Prendre une photo' }));
  unmount();
  await act(async () => resolve({ getTracks: () => [{ stop }] }));
  expect(stop).toHaveBeenCalledOnce();
  expect(onPhoto).not.toHaveBeenCalled();
});

it('reports denied camera access without offering file upload', async () => {
  vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
  vi.stubGlobal('navigator', {
    mediaDevices: { getUserMedia: vi.fn().mockRejectedValue(new Error('Permission denied')) }
  });
  const { onError, container } = mount();
  fireEvent.click(screen.getByRole('button', { name: 'Prendre une photo' }));
  await waitFor(() =>
    expect(onError).toHaveBeenLastCalledWith(expect.stringContaining('Autorise'))
  );
  expect(container.querySelector('input[type=file]')).toBeNull();
});

it('uses the existing native camera plugin and options', async () => {
  vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
  const camera = vi
    .mocked(Camera.takePhoto)
    .mockResolvedValue({ thumbnail: 'native-photo', type: 0, saved: false });
  const { onPhoto } = mount();
  fireEvent.click(screen.getByRole('button', { name: 'Prendre une photo' }));
  await waitFor(() => expect(onPhoto).toHaveBeenCalledWith('data:image/jpeg;base64,native-photo'));
  expect(camera).toHaveBeenCalledWith(
    expect.objectContaining({
      quality: 70,
      targetWidth: 300,
      targetHeight: 300,
      saveToGallery: false
    })
  );
});
