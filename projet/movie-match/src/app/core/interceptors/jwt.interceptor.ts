import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const base = environment.apiUrl.replace(/\/$/, '');
  const isBackend = req.url.startsWith(`${base}/`);
  const path = req.url.split('?')[0];
  const isPublicAuth = path === `${base}/auth/login` || path === `${base}/auth/register`;
  if (token && isBackend && !isPublicAuth) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
