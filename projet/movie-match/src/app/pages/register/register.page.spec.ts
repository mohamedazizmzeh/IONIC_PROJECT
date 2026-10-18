import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterPage } from './register.page';
import { provideRouter } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { Camera, MediaType } from '@capacitor/camera';

vi.mock('@capacitor/camera', async importOriginal => {
  const actual = await importOriginal<typeof import('@capacitor/camera')>();
  return { ...actual, Camera: { takePhoto: vi.fn() } };
});

describe('RegisterPage', () => {
  let component: RegisterPage;
  let fixture: ComponentFixture<RegisterPage>;

  beforeEach(() => {
    vi.mocked(Camera.takePhoto).mockReset();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('offers camera capture without a file upload input', () => {
    expect(fixture.nativeElement.querySelector('input[type=file]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Prendre une photo');
  });

  it('takes a new photo with the native camera', async () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
    const takePhoto = vi.mocked(Camera.takePhoto).mockResolvedValue({
      type: MediaType.Photo, saved: false, thumbnail: 'captured-photo'
    });
    await component.openCamera();
    expect(takePhoto).toHaveBeenCalledWith(expect.objectContaining({ saveToGallery: false }));
    expect(component.photo).toBe('data:image/jpeg;base64,captured-photo');
  });

  it('explains when browser camera access is unavailable', async () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
    vi.stubGlobal('navigator', { mediaDevices: undefined });
    await component.openCamera();
    expect(component.error).toContain('HTTPS');
    expect(component.photo).toBeUndefined();
  });

  it('stops the browser camera when capture is cancelled', async () => {
    const stop = vi.fn();
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    const getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] });
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    await component.openCamera();
    expect(getUserMedia).toHaveBeenCalledWith(expect.objectContaining({ audio: false }));
    expect(component.cameraOpen).toBe(true);
    component.closeCamera();
    expect(stop).toHaveBeenCalledOnce();
    expect(component.cameraOpen).toBe(false);
  });

  it('shows an error when camera permission is denied', async () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
    const getUserMedia = vi.fn().mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'));
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    await component.openCamera();
    expect(component.error).toContain('Autorise');
    expect(component.openingCamera).toBe(false);
    expect(component.photo).toBeUndefined();
  });

  it('stops a stream that arrives after the page has been destroyed', async () => {
    const stop = vi.fn();
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);
    let grantAccess = () => {};
    const getUserMedia = vi.fn().mockImplementation(() => new Promise(resolve => {
      grantAccess = () => resolve({ getTracks: () => [{ stop }] });
    }));
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    const opening = component.openCamera();
    fixture.destroy();
    grantAccess();
    await opening;
    expect(stop).toHaveBeenCalledOnce();
    expect(component.cameraOpen).toBe(false);
  });
});
