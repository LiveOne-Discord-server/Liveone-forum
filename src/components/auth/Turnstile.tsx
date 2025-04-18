
// Completely disable Turnstile verification
export default function Turnstile({ sitekey, onVerify }: { sitekey: string, onVerify: (token: string) => void }) {
  // Immediately call onVerify with a dummy token when component mounts
  if (typeof onVerify === 'function') {
    setTimeout(() => {
      onVerify('auto-verified-token');
    }, 0);
  }
  
  // Return empty div 
  return <div style={{ display: 'none' }}></div>;
}
