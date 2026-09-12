import { UserRepository } from './repositories/userRepository';
import { UserProfile } from '../types';
import { apiUrl } from './apiConfig';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  name: string;
  phone?: string;
  phoneVerified?: boolean;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

const SESSION_KEY = 'smart_time_auth_session';
const DEVICE_ID_KEY = 'smart_time_device_id';
export function getDeviceId(): string {
  try { const existing=localStorage.getItem(DEVICE_ID_KEY); if(existing && existing.length>=16) return existing; const id=typeof crypto!=='undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`; localStorage.setItem(DEVICE_ID_KEY,id); return id; } catch { return `ephemeral-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`; } }
const api = (path: string, options: RequestInit = {}) => fetch(apiUrl(path), {
  ...options,
  headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(options.headers || {}) },
});

function saveSession(session: AuthSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
export function getStoredSession(): AuthSession | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}
export function clearSession() { localStorage.removeItem(SESSION_KEY); }
export function authHeaders() {
  const session = getStoredSession();
  return session?.token ? { Authorization: `Bearer ${session.token}` } : {};
}

async function request(path: string, body: Record<string, unknown>) {
  const res = await api(path, { method: 'POST', body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'حدث خطأ في الاتصال بالخادم');
  return data;
}

function applyUserToProfile(user: AuthUser): UserProfile {
  const current = UserRepository.getProfile();
  const updated = UserRepository.updateProfile({
    id: user.id,
    name: user.name || current.name,
    email: user.email || current.email,
    phone: user.phone || current.phone,
    // Phone verification is not required for chat; phone remains optional account data.
    isOnboarded: true,
  });
  return updated;
}

export async function loginWithIdentifier(identifier: string, password: string): Promise<AuthSession> {
  const data = await request('/api/auth/login', { identifier, password });
  const session: AuthSession = { token: data.token, user: data.user };
  saveSession(session); applyUserToProfile(session.user); return session;
}


export async function requestPhoneLoginOtp(phone: string) { return request('/api/auth/phone-login/request-otp', { phone }); }

export async function loginWithPhone(phone: string, code: string): Promise<AuthSession> {
  const data = await request('/api/auth/phone-login', { phone, code });
  const session: AuthSession = { token: data.token, user: data.user };
  saveSession(session); applyUserToProfile(session.user); return session;
}

export async function requestPasswordReset(email: string) {
  return request('/api/auth/forgot-password', { email });
}

export async function resetPassword(email: string, code: string, newPassword: string) {
  return request('/api/auth/reset-password', { email, code, newPassword });
}

export async function registerWithEmail(name: string, username: string, email: string, password: string, phone: string): Promise<any> {
  const data = await request('/api/auth/register', { name, username, email, password, phone, deviceId: getDeviceId() });
  if (!data.token) return data;
  const session: AuthSession = { token: data.token, user: data.user };
  saveSession(session); applyUserToProfile(session.user);
  // Return every field the server sent (devCode, smsSent, smsWarning, requiresPhoneVerification, ...),
  // not just {token, user} — the caller needs those to tell the person what actually happened.
  return { ...data, token: session.token, user: session.user };
}

export async function verifyRegistrationPhone(phone: string, code: string): Promise<any> { const data=await request('/api/auth/register/verify-phone',{phone,code,deviceId:getDeviceId()}); if(data?.user){ const current=getStoredSession(); if(current?.token){ saveSession({token:current.token,user:data.user}); applyUserToProfile(data.user); } } return data; }
export async function requestTripsPhoneOtp(phone: string): Promise<any> { return request('/api/auth/trips/request-phone-otp',{phone}); }
export async function verifyTripsPhone(phone: string, code: string): Promise<any> { const data=await request('/api/auth/trips/verify-phone',{phone,code,deviceId:getDeviceId()}); if(data?.user){ const current=getStoredSession(); if(current?.token){ saveSession({token:current.token,user:data.user}); applyUserToProfile(data.user); } } return data; }

export async function restoreSession(): Promise<AuthSession | null> {
  const stored = getStoredSession();
  if (!stored?.token) return null;
  try {
    const res = await api('/api/auth/me', { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error();
    const session = { token: stored.token, user: data.user } as AuthSession;
    saveSession(session); applyUserToProfile(session.user); return session;
  } catch { clearSession(); return null; }
}

export async function requestChatOtp(phone: string) {
  return request('/api/auth/chat/request-otp', { phone });
}

export async function verifyChatOtp(phone: string, code: string): Promise<AuthSession> {
  const data = await request('/api/auth/chat/verify-otp', { phone, code, token: getStoredSession()?.token });
  const session: AuthSession = { token: data.token, user: data.user };
  saveSession(session); applyUserToProfile(session.user); return session;
}

export async function logout() {
  try { await api('/api/auth/logout', { method: 'POST', headers: authHeaders() }); } catch {}
  clearSession();
}
