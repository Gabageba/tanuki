import { generateVAPIDKeys } from 'web-push';

const KEYS = generateVAPIDKeys();
console.log(`VAPID_PUBLIC_KEY=${KEYS.publicKey}\nVAPID_PRIVATE_KEY=${KEYS.privateKey}`);
