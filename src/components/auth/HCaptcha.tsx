
import React from 'react';

// This is a placeholder component since the real hCaptcha was removed
// It doesn't actually do anything but satisfies the import
const HCaptcha = ({ 
  sitekey, 
  onVerify 
}: { 
  sitekey: string; 
  onVerify: (token: string) => void;
}) => {
  // Since we're removing hCaptcha functionality, this is just an empty component
  return null;
};

export default HCaptcha;
