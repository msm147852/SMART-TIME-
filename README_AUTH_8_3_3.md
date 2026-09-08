# SMART TIME V8.3.3 — Owner Activation + SMS Chat Verification

- Account registration creates a `pending` account.
- Login is blocked until the program owner approves the account.
- Program owner identity defaults to `eng.mamdouh2009@gmail.com` and can be overridden by `PROGRAM_OWNER_EMAIL`.
- Owner activation requires a server-only `PROGRAM_OWNER_ACTIVATION_KEY`.
- Chat phone verification is separate and uses SMS OTP.
- SMS adapters: `twilio` or `webhook`.
- Phone number remains private in public user data; display name is the chat identity.

Production environment variables must be configured in the server environment and never in `VITE_*` variables.
