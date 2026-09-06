import React from 'react';

/** Phone verification is intentionally disabled for chat in SMART TIME 8.3.6.
 * Kept as a compatibility stub so older imports/build caches do not break.
 */
export const ChatPhoneGate: React.FC<{ onVerified:()=>void; onBack:()=>void }> = ({onVerified}) => {
  React.useEffect(() => { onVerified(); }, [onVerified]);
  return null;
};
