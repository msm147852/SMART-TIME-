# SMART VOICE DNA

SMART VOICE DNA is the privacy-first foundation for personalized SMART TIME speech.

## V1 scope

The current implementation creates a private voice profile on the user's device. A profile contains a display name and family relationship label, language and locale metadata, explicit owner-consent state, guardian-consent state for child profiles, recording duration and timestamps, and a local engine status.

The recorded sample is stored in IndexedDB and encrypted with a non-exportable AES-GCM key kept in the browser's local storage area. The sample is not written to Git, server logs, chat context, or SMART AI prompts.

V1 does not claim that the browser has cloned the person's voice. The profile stays in pending_local_engine state until a dedicated local TTS/voice-cloning engine is connected.

## Consent model

A person's voice should be created by that person. Family relationships are metadata, not proof of identity.

For child profiles, a guardian consent flag is required in addition to the voice-owner confirmation flow.

SMART TIME should not accept an audio file of another person as proof of authorization. The future sharing flow should let a voice owner create and authorize their own profile, then share that profile privately with selected family accounts.

## Planned runtime

SMART AI response
-> text
-> Voice DNA adapter
-> local Egyptian-Arabic TTS / voice-cloning engine
-> audio

The adapter boundary is intentionally separate from SMART AI so the TTS engine can be swapped without changing the AI/data layer.

## Next local engine

The first production candidate should be an Egyptian-Arabic-capable engine with zero-shot speaker conditioning and a self-hosted runtime. The integration should expose an internal TTS endpoint, keep voice samples on the GPU host or private storage, and require an explicit voice-profile identifier rather than accepting arbitrary remote audio URLs.

## Security rules

Never log raw audio, consent phrases, voice embeddings, or private voice-profile tokens.

Never put raw voice samples in GitHub.

Never train SMART AI on customer voice recordings or customer application records by default.

Use private family sharing with revocation when the same profile is made available to another family account.

## Browser fallback

Until the local engine is wired, the browser Web Speech adapter remains available for generic male/female/youth/child playback. Those presets are not Voice DNA clones.


## Private family sharing

V1 now supports server-side sharing metadata. The owner registers the profile metadata and can send a private share request to another SMART TIME account by username or email. The recipient can accept or revoke access.

The reference audio is intentionally not uploaded or copied by this sharing layer. The share status is a permission record only. Secure sample synchronization is a separate future step so that audio storage, encryption, and revocation can be designed independently.
