export const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

export const isValidSomaliMobile = (value) => {
  const d = digitsOnly(value);
  if (d.length === 9 && (d.startsWith('61') || d.startsWith('62'))) return true;
  if (d.length === 10 && (d.startsWith('061') || d.startsWith('062'))) return true;
  return false;
};

export const formatPhoneHint = '9 digits (61… / 62…) or 10 digits (061… / 062…)';
