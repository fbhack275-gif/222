/**
 * Helper to safely open WhatsApp with pre-filled Bangla text without popup blocker issues.
 */
export function sendWhatsAppMessage(phoneNumber: string, message: string): void {
  const cleanPhone = (phoneNumber || '').replace(/[^0-9]/g, '');
  const intlPhone = cleanPhone.startsWith('0')
    ? '88' + cleanPhone
    : cleanPhone.startsWith('880')
    ? cleanPhone
    : cleanPhone ? '88' + cleanPhone : '';

  const encoded = encodeURIComponent(message);
  const url = intlPhone ? `https://wa.me/${intlPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;

  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    try {
      document.body.removeChild(link);
    } catch {
      // ignore
    }
  }, 100);
}
