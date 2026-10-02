import fs from 'node:fs';

const manifestPath = 'infra/smart-voice/phase12-asr-corpus-manifest.json';
const docPath = 'docs/PHASE_12_REAL_STT_ASR_CORPUS.md';
const voicePath = 'src/components/VoiceSearchModal.tsx';
const appPath = 'src/App.tsx';
const aiPath = 'src/components/AiCenterView.tsx';
const evidenceSchemaPath = 'docs/PHASE_12_RUNTIME_EVIDENCE_SCHEMA.json';
const voiceConversationPath = 'src/components/SmartAiVoiceConversationModal.tsx';
const smartAiDemoPath = 'components/smart-ai/SmartAIDemo.tsx';

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const doc = fs.readFileSync(docPath, 'utf8');
const voice = fs.readFileSync(voicePath, 'utf8');
const app = fs.readFileSync(appPath, 'utf8');
const ai = fs.readFileSync(aiPath, 'utf8');
const evidenceSchema = JSON.parse(fs.readFileSync(evidenceSchemaPath, 'utf8'));
const voiceConversation = fs.readFileSync(voiceConversationPath, 'utf8');
const smartAiDemo = fs.readFileSync(smartAiDemoPath, 'utf8');

if (manifest.phase !== 12) throw new Error('Phase 12 manifest mismatch');
if (manifest.status !== 'IN_PROGRESS') throw new Error('Phase 12 must remain IN_PROGRESS until every gate passes');
if (manifest.training_authorized_by_phase !== false) throw new Error('Phase 12 must not silently authorize training');
if (manifest.corpus_policy.raw_corpus_in_git !== false) throw new Error('Raw corpus Git policy must be false');
if (manifest.corpus_policy.user_recordings_added_to_corpus_by_default !== false) {
  throw new Error('User recordings must not enter corpus by default');
}
if (manifest.stt_contract.primary_locale !== 'ar-EG') throw new Error('Primary STT locale must be ar-EG');
if (manifest.stt_contract.fake_transcript_forbidden !== true) throw new Error('Fake transcript path must be forbidden');
if (manifest.stt_contract.timer_driven_transcript_forbidden !== true) throw new Error('Timer transcript path must be forbidden');
if (manifest.stt_contract.privacy_disclosure_required !== true) throw new Error('STT privacy disclosure must be required');
if (manifest.stt_contract.raw_microphone_audio_logged !== false) throw new Error('Raw microphone logging must remain disabled');
if (manifest.stt_contract.raw_microphone_audio_persisted_by_app !== false) throw new Error('Raw microphone persistence must remain disabled');
if (!voice.includes('قد تتم معالجة الصوت عبر خدمة التعرف')) throw new Error('Arabic STT privacy disclosure is missing');
if (!voice.includes('SpeechRecognition')) throw new Error('Real SpeechRecognition implementation is missing');
if (!voice.includes("ar-EG")) throw new Error('Egyptian Arabic STT locale is missing');
if (voice.includes('setTimeout')) throw new Error('Timer-driven fake voice path is still present');
if (voice.includes('Simulated Voice recognition speech stream')) throw new Error('Simulated voice recognition path is still present');
if (voice.includes('Compare ride prices to work')) throw new Error('Hard-coded fake transcript is still present');
if (!voice.includes('onTranscript')) throw new Error('Voice modal must expose the final transcript boundary');
if (!voice.includes('onTranscriptRef.current?.(next)')) throw new Error('Final transcript callback must execute outside React state updater');
if (voice.includes('console.log') || voice.includes('console.error') || voice.includes('console.warn')) throw new Error('Voice STT component must not log microphone/transcript/provider data');
if (!app.includes('onTranscript={handleVoiceTranscript}')) throw new Error('App must consume the final STT transcript callback');
if (!app.includes('initialInputText={voiceTranscript}')) throw new Error('Final STT transcript must reach the AI input boundary');
if (!ai.includes('initialInputText?: string')) throw new Error('AI input boundary prop is missing');
if (!ai.includes('setInputText(initialInputText.trim())')) throw new Error('AI input does not consume the final transcript');
if (!app.includes('handleVoiceTranscript')) throw new Error('App voice transcript handler is missing');
if (!app.includes('setIsVoiceOpen(false)')) throw new Error('Voice modal must close without auto-executing an AI action');
if (!ai.includes('onSubmit')) throw new Error('AI input form boundary is missing');
if (!smartAiDemo.includes('SmartAiVoiceConversationModal')) throw new Error('SMART AI service demo is missing the voice conversation modal');
if (!smartAiDemo.includes('setVoiceConversationOpen(true)')) throw new Error('SMART AI service demo voice conversation entry button is missing');
if (!smartAiDemo.includes('sendMessage(undefined, transcript)')) throw new Error('SMART AI service demo must route final voice turns into its AI send boundary');
const inferRoute = fs.readFileSync('app/api/ai/infer/route.ts', 'utf8');
if (!inferRoute.includes('SMART_AI_LOCAL_URL is not configured; app-owned rules response used.')) throw new Error('SMART AI demo fallback response contract is missing');
if (!inferRoute.includes('answerWithRules(input, "ar", appData)')) throw new Error('SMART AI demo must use the verified app-owned rules fallback when local model is absent');
if (!voiceConversation.includes("if (activeRef.current) startListening();")) throw new Error('voice conversation restart contract is missing');
if (!voiceConversation.includes("SMART AI استقبل كلامك، لكن الرد الصوتي فشل.")) throw new Error('voice conversation must surface AI/TTS failure instead of silently restarting');
if (smartAiDemo.includes('webkitSpeechRecognition') || smartAiDemo.includes('continuous = false')) throw new Error('SMART AI service demo still contains the legacy one-shot STT path');
if (!ai.includes('SmartAiVoiceConversationModal')) throw new Error('SMART AI voice conversation modal is not wired into the AI view');
if (!ai.includes('setIsVoiceConversationOpen(true)')) throw new Error('SMART AI voice conversation entry button is missing');
if (!ai.includes('handleSendMessage(transcript, true)')) throw new Error('Voice conversation must send the observed turn through the AI message boundary');
if (!voiceConversation.includes('continuous = false')) throw new Error('Voice conversation must isolate each conversational turn');
if (!voiceConversation.includes('interimResults = true')) throw new Error('Voice conversation must expose interim speech feedback');
if (!voiceConversation.includes('onspeechend')) throw new Error('Voice conversation must detect speech end before processing a turn');
if (!voiceConversation.includes('await onTurnRef.current(text)')) throw new Error('Voice conversation must await the AI response boundary');
if (!voiceConversation.includes('turnGenerationRef')) throw new Error('Voice conversation must guard interrupted turns from reopening the microphone');
if (!voiceConversation.includes('onInterrupt')) throw new Error('Voice conversation must expose an explicit AI interruption boundary');
if (!voiceConversation.includes('isLikelyDuplicate')) throw new Error('Voice conversation must protect mobile transcripts from duplicate final phrases');
if (!voiceConversation.includes('if (activeRef.current) startListening()')) throw new Error('Voice conversation must return to listening only after the turn completes');
if (voiceConversation.includes('console.log') || voiceConversation.includes('console.error') || voiceConversation.includes('console.warn')) throw new Error('Voice conversation component must not log microphone/transcript/provider data');
if (!evidenceSchema.required_cases || evidenceSchema.required_cases.length !== 7) throw new Error('Phase 12 runtime evidence schema is incomplete');

for (const required of [
  'Real STT capture',
  'Egyptian Arabic routing',
  'Transcript integrity',
  'ASR corpus provenance',
  'Corpus quality',
  'Privacy/security',
  'Reproducibility',
  'Behavioral evidence'
]) {
  if (!doc.includes(required)) throw new Error(`Missing Phase 12 gate: ${required}`);
}

for (const source of manifest.sources) {
  if (!source.id || !source.name || !source.language || !source.acquisition_status) {
    throw new Error('Every corpus source needs identity, language and acquisition status');
  }
}

console.log('PHASE 12 STATIC CONTRACT: PASS');

if (!smartAiDemo.includes('/api/ai/egyptian-tts')) throw new Error('SMART AI demo must use the server Egyptian TTS runtime');
if (!fs.readFileSync('server.ts', 'utf8').includes('app.post("/api/ai/egyptian-tts"')) throw new Error('Egyptian TTS endpoint is missing');
if (!fs.readFileSync('infra/smart-voice/voicetut-provider/app.py', 'utf8').includes('speaker: str = ""')) throw new Error('VoiceTuT provider must support built-in Egyptian speakers');
if (!fs.readFileSync('infra/smart-voice/voicetut-provider/app.py', 'utf8').includes('allowed_speakers')) throw new Error('VoiceTuT provider must allowlist built-in speakers');
if (!fs.readFileSync('server.ts', 'utf8').includes('speaker: "Mohamed"')) throw new Error('SMART AI must request an explicit Egyptian built-in speaker');

console.log('PHASE 12 CLOSURE: BLOCKED UNTIL REAL-STT + CORPUS + SECURITY + REPRO + BEHAVIORAL EVIDENCE PASS');
