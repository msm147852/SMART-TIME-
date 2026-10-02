import fs from 'node:fs';

const manifestPath = 'infra/smart-voice/phase12-asr-corpus-manifest.json';
const docPath = 'docs/PHASE_12_REAL_STT_ASR_CORPUS.md';
const voicePath = 'src/components/VoiceSearchModal.tsx';
const appPath = 'src/App.tsx';
const aiPath = 'src/components/AiCenterView.tsx';

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const doc = fs.readFileSync(docPath, 'utf8');
const voice = fs.readFileSync(voicePath, 'utf8');
const app = fs.readFileSync(appPath, 'utf8');
const ai = fs.readFileSync(aiPath, 'utf8');

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
if (!voice.includes('SpeechRecognition')) throw new Error('Real SpeechRecognition implementation is missing');
if (!voice.includes("ar-EG")) throw new Error('Egyptian Arabic STT locale is missing');
if (voice.includes('setTimeout')) throw new Error('Timer-driven fake voice path is still present');
if (voice.includes('Simulated Voice recognition speech stream')) throw new Error('Simulated voice recognition path is still present');
if (voice.includes('Compare ride prices to work')) throw new Error('Hard-coded fake transcript is still present');
if (!voice.includes('onTranscript')) throw new Error('Voice modal must expose the final transcript boundary');
if (!app.includes('onTranscript={(finalTranscript)')) throw new Error('App must consume the final STT transcript');
if (!app.includes('initialInputText={voiceTranscript}')) throw new Error('Final STT transcript must reach the AI input boundary');
if (!ai.includes('initialInputText?: string')) throw new Error('AI input boundary prop is missing');
if (!ai.includes('setInputText(initialInputText.trim())')) throw new Error('AI input does not consume the final transcript');

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

console.log('PHASE 12 CONTRACT: PASS');
console.log('PHASE 12 CLOSURE: BLOCKED UNTIL REAL-STT + CORPUS + SECURITY + REPRO + BEHAVIORAL EVIDENCE PASS');
