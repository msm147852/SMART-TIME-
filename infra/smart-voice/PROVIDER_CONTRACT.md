# SMART VOICE DNA provider contract

The Voice DNA provider is intentionally a replaceable boundary.

## Request

The provider receives text plus the selected profile reference audio in memory:
- text
- language
- locale
- profileId
- referenceAudio
- referenceMimeType
- optional referenceText
- optional speakingStyle

## Response

The provider returns audio bytes and a MIME type. It may be implemented by a local GPU service, a private LAN service, or another approved inference runtime.

## Security

Use TLS outside a trusted local host, authenticate requests, avoid request-body logging, avoid persistent reference-audio storage by default, and provide profile revocation/deletion for persistent voice accounts.

The UI requires explicit voice-owner consent before personalized synthesis.

## Egyptian Arabic

VoiceTuT-TTS currently documents Egyptian-Arabic specialization, zero-shot voice cloning, code-switching, and local/self-hosted deployment. Its public repository states Apache-2.0 for the project; verify model and commercial deployment terms before production use.