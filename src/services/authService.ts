import { UserRepository } from './repositories/userRepository';
import { UserProfile } from '../types';
import { apiUrl } from './apiConfig';

export interface AuthUser { id: string; email: string; username?: string; name: string; phone?: string; phoneVerified?: boolean; }
export interface AuthSession { user: AuthUser; }

const DEVICE_ID_KEY = 'smart_time_device_id';
let currentSession: AuthSession | null = null;

export function getDeviceId(): string {
  try {
    const existing=localStorage.getItem(DEVICE_ID_KEY);
    if(existing && existing.length>=16) return existing;
    const id=typeof crypto!=='undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_ID_KEY,id); return id;
  } catch { return `ephemeral-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`; }
}

const api = (path: string, options: RequestInit = {}) => fetch(apiUrl(path), {
  ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
});
export function getStoredSession(): AuthSession | null { return currentSession; }
export function clearSession() { currentSession = null; }
export function authHeaders() { return {}; }
async function request(path: string, body: Record<string, unknown>) {
  const res = await api(path, { method: 'POST', body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'حدث خطأ في الاتصال بالخادم');
  return data;
}
function saveSession(session: AuthSession) { currentSession = session; }
function applyUserToProfile(user: AuthUser): UserProfile {
  const current = UserRepository.getProfile();
  return UserRepository.updateProfile({ id:user.id, name:user.name||current.name, email:user.email||current.email, phone:user.phone||current.phone, isOnboarded:true });
}
function adopt(data: any): AuthSession { const session:AuthSession={user:data.user}; saveSession(session); applyUserToProfile(session.user); return session; }

export async function startTrialSession(): Promise<AuthSession> { const res=await fetch(apiUrl('/api/trial/session'),{credentials:'include'}); const data=await res.json().catch(()=>({})); if(!res.ok||!data.user)throw new Error(data.error||'تعذر بدء النسخة التجريبية'); return adopt(data); }
export async function loginWithIdentifier(identifier:string,password:string):Promise<AuthSession>{return adopt(await request('/api/auth/login',{identifier,password}));}
export async function requestPhoneLoginOtp(phone:string){return request('/api/auth/phone-login/request-otp',{phone});}
export async function loginWithPhone(phone:string,code:string):Promise<AuthSession>{return adopt(await request('/api/auth/phone-login',{phone,code}));}
export async function requestPasswordReset(email:string){return request('/api/auth/forgot-password',{email});}
export async function resetPassword(email:string,code:string,newPassword:string){return request('/api/auth/reset-password',{email,code,newPassword});}
export async function registerWithEmail(name:string,username:string,email:string,password:string,phone:string):Promise<any>{return request('/api/auth/register',{name,username,email,password,phone,deviceId:getDeviceId()});}
export async function verifyRegistrationEmail(email:string,code:string):Promise<AuthSession>{return adopt(await request('/api/auth/register/verify-email',{email,code}));}
export async function resendRegistrationEmail(email:string){return request('/api/auth/register/resend-email',{email});}
export async function verifyRegistrationPhone(phone:string,code:string):Promise<any>{return request('/api/auth/register/verify-phone',{phone,code,deviceId:getDeviceId()});}
export async function requestTripsPhoneOtp(phone:string):Promise<any>{return request('/api/auth/trips/request-phone-otp',{phone});}
export async function verifyTripsPhone(phone:string,code:string):Promise<any>{return request('/api/auth/trips/verify-phone',{phone,code,deviceId:getDeviceId()});}
export async function restoreSession():Promise<AuthSession|null>{try{const res=await api('/api/auth/me');const data=await res.json();if(!res.ok||!data.user)throw new Error();return adopt(data);}catch{clearSession();return null;}}
export async function requestChatOtp(phone:string){return request('/api/auth/chat/request-otp',{phone});}
export async function verifyChatOtp(phone:string,code:string):Promise<AuthSession>{return adopt(await request('/api/auth/chat/verify-otp',{phone,code}));}
export async function logout(){try{await api('/api/auth/logout',{method:'POST'});}catch{}clearSession();}
