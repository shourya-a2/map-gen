export const VAULT_STORAGE_KEYS = {
  coins: 'codebusters.vault.coins',
  vaults: 'codebusters.vault.vaults',
  activeVault: 'codebusters.vault.active',
};

export const readVaultStorage = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;

  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

export const writeVaultStorage = (key, value) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Storage can be unavailable in private browsing or restricted embeds.
  }
};
