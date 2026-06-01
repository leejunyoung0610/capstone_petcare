import { apiBaseURL } from '../api/client';

/**
 * iOS(WebKit) 및 macOS Safari는 blob URL + programmatic click / download 속성을
 * 지원하지 않거나, axios 완료 후에는 사용자 제스처가 만료되어 창이 열리지 않는다.
 * 이 경우 백엔드 PDF URL(?token=)을 동기적으로 열어 Safari 내장 PDF 뷰어로 표시한다.
 */
export function needsDirectPdfNavigation() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari =
    /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|OPiOS|Android/i.test(ua);
  return isIOS || isSafari;
}

/** @param {string} apiPath e.g. `/diagnosis/3/pdf` */
export function openPdfViaDirectUrl(apiPath) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const base = apiBaseURL.replace(/\/$/, '');
  const path = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  const pdfUrl = `${base}${path}?token=${encodeURIComponent(token)}`;

  const opened = window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  if (!opened) {
    window.location.assign(pdfUrl);
  }
}

/** blob 응답을 파일로 저장 (Android Chrome · 데스크톱) */
export function savePdfBlob(blob, filename) {
  if (!(blob instanceof Blob) || blob.size < 100) {
    throw new Error('PDF 응답이 올바르지 않습니다.');
  }

  const pdfBlob = new Blob([blob], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 30_000);
}
