import { apiUrl } from "./apiConfig";
import { authHeaders } from "./authService";

export interface RegisterVoiceDnaProfileRequest {
  id: string;
  displayName: string;
  relationship: string;
  language: "ar" | "en";
  dialect: string;
  speakingStyle: string;
  engineStatus: string;
  ownerConfirmed: boolean;
  guardianConfirmed: boolean;
  consentRecordedAt: string;
}

export interface VoiceDnaShareRecord {
  id: string;
  profileId: string;
  displayName: string;
  status: "pending" | "active" | "revoked";
  recipientUsername?: string;
  recipientUserId?: string;
  ownerUsername?: string;
  ownerUserId?: string;
  createdAt: string;
  acceptedAt?: string | null;
  revokedAt?: string | null;
}

async function apiRequest(path: string, options: RequestInit = {}) {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: { "Content-Type": "application/json", ...authHeaders(), ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || "تعذر تنفيذ عملية Voice DNA.");
  return payload;
}

export async function registerVoiceDnaProfile(request: RegisterVoiceDnaProfileRequest): Promise<void> {
  await apiRequest("/api/voice-dna/profiles", { method: "POST", body: JSON.stringify(request) });
}

export async function createVoiceDnaShare(profileId: string, recipientIdentifier: string): Promise<void> {
  await apiRequest("/api/voice-dna/shares", {
    method: "POST",
    body: JSON.stringify({ profileId, recipientIdentifier }),
  });
}

export async function listVoiceDnaShares(): Promise<{ outgoing: VoiceDnaShareRecord[]; incoming: VoiceDnaShareRecord[] }> {
  return await apiRequest("/api/voice-dna/shares");
}

export async function acceptVoiceDnaShare(shareId: string): Promise<void> {
  await apiRequest("/api/voice-dna/shares/" + encodeURIComponent(shareId) + "/accept", { method: "POST" });
}

export async function revokeVoiceDnaShare(shareId: string): Promise<void> {
  await apiRequest("/api/voice-dna/shares/" + encodeURIComponent(shareId) + "/revoke", { method: "POST" });
}
