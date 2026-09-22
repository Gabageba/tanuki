export type RegisterFormValues = {
  email: string;
  username: string;
  password: string;
  termsAccepted: boolean;
};

const getSubmittedEmailStorageKey = (inviteCode: string) =>
  `tanuki-register-submitted:${inviteCode}`;

export const readSubmittedEmail = (inviteCode: string | null): string | null => {
  if (!inviteCode) return null;
  try {
    return sessionStorage.getItem(getSubmittedEmailStorageKey(inviteCode));
  } catch {
    return null;
  }
};

export const writeSubmittedEmail = (inviteCode: string, email: string) => {
  try {
    sessionStorage.setItem(getSubmittedEmailStorageKey(inviteCode), email);
  } catch {
    // sessionStorage может быть недоступен (приватный режим)
  }
};
