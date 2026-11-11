// Remembers only the email on this device so unlocking is just a password.
const KEY = 'rm_email'
export const getRememberedEmail = () => { try { return localStorage.getItem(KEY) ?? '' } catch { return '' } }
export const rememberEmail = (e: string) => { try { localStorage.setItem(KEY, e) } catch { /* private mode */ } }
