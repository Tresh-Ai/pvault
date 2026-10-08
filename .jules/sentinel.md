## 2025-05-18 - OAuth Popup Window vs noopener
**Vulnerability:** Reverse tabnabbing / opener hijacking when opening user-supplied external URLs in new tabs.
**Learning:** Adding `noopener` or `noreferrer` to `window.open` feature strings for popups (e.g. `window.open(url, name, 'width=520,height=720,noopener,noreferrer')`) causes modern browsers to return `null` for the window object reference.
**Prevention:** Only apply `noopener,noreferrer` to standard external link openings where a `Window` object handle is not required. For OAuth popups that require popup handle checking or cross-window messaging (`window.opener`), rely on `event.origin` validation on `message` listeners instead of disabling window opener references.
