// A public plan identifier is never an authentication credential.
export const OWNER_UID = import.meta.env.VITE_OWNER_UID || 'e8a57bf1-58c2-45ae-b1ab-65c1e6921ad9';

// Personal browser gate requested by the owner; this is not a database secret.
export const PIN_HASH = '1082e94ac3adabd241b6900f7e6bd078b43dadf2285c75c08c17b3d4fff59278';
