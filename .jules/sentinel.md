## 2025-05-18 - OAuth PKCE Code Verifier Cleanup
**Vulnerability:** OAuth PKCE code verifier secrets stored in `localStorage` were not cleaned up if the key exchange request failed or threw an exception.
**Learning:** Temporary PKCE code verifiers stored in `localStorage` could linger indefinitely if any error occurred prior to the `removeItem` call.
**Prevention:** Wrap OAuth code exchange logic in a `try...finally` block to ensure `localStorage` cleanup always executes regardless of network or parsing errors.
