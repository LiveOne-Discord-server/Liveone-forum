
// Completely remove HCaptcha verification
export default function HCaptcha({ sitekey, onVerify }: { sitekey: string, onVerify: (token: string) => void }) {
  // Immediately call onVerify with a dummy token to bypass verification
  if (typeof onVerify === 'function') {
    setTimeout(() => {
      onVerify('auto-verified-token');
    }, 0);
  }
  
  // Return empty div instead of null
  return <div style={{ display: 'none' }}></div>;
}
