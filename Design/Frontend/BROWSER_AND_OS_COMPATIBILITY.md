# Customer Frontend Browser And Operating-System Compatibility

Status: confirmed design direction. Exact browser versions are evaluated again before each public release because evergreen browsers change frequently.

## 1. Objective
The DatingEasy888 customer Frontend must provide the same core registration, discovery, profile, chat, safety, credits, and account workflows across common desktop and mobile operating systems.

Customers may choose either:

1. The customer website in a supported desktop or mobile browser
2. A future installed iOS or Android customer application

The browser experience remains fully supported after the native applications
launch. Installing an application is optional and cannot be required for
registration, profile management, discovery, favorites, chat, purchases,
credits, gifts, blocking, reporting, privacy, or account management.

Native-only conveniences may include push notifications, biometric sign-in,
camera integration, and operating-system shortcuts. Equivalent core outcomes
must remain available in the browser.

## 2. Supported Operating-System Families

### Fully Supported
- Windows 10 version 22H2 as a legacy target, subject to the security conditions below
- Windows 11
- Mac computers introduced in 2020 or later running macOS 12 Monterey or later
- Mainstream supported Linux desktop distributions capable of running a supported browser
- iPhone and iPad running iOS/iPadOS 17 or later
- Android versions supported by the selected current browsers
- ChromeOS with current Chrome

### Best Effort
- Other Unix and Unix-like desktop systems running a standards-compliant current browser
- Older but still functional operating systems outside the primary test matrix

Best effort means the site may work, but every release is not certified on that operating system.

Unsupported operating systems do not receive security or compatibility guarantees.

### Windows 10 Security Condition
Microsoft ended normal Windows 10 support on October 14, 2025. DatingEasy888
will test Windows 10 version 22H2 as a legacy customer target through October 13,
2026, when the Consumer Extended Security Updates period ends.

- Customers should use current Edge or Chrome.
- Customers should install all available Windows and browser security updates.
- Windows 10 without applicable security updates is not considered a secure
  configuration even if the website remains functional.
- Continued Windows 10 certification after October 13, 2026 requires a separate
  security and usage review.
- Windows 11 is the recommended Windows platform.

Microsoft states that Edge updates on Windows 10 22H2 will continue until at
least October 2028. Browser updates do not replace operating-system security
updates.

### Apple Version Clarification
The submitted phrase `Apple 17` is interpreted as iOS/iPadOS 17, not the iPhone
17 hardware model.

Apple has not released a macOS version 20. The submitted `MacOS 20` requirement
is interpreted as Mac computers introduced in 2020 or later. The minimum
software target is macOS 12 Monterey. As of June 7, 2026, Apple's current Mac
operating-system release is macOS Tahoe 26.5.

Web compatibility is determined mainly by the installed operating system and
browser. The release test pool should include at least one representative
2020-era Mac and current Apple hardware.

## 3. Supported Browser Families

### Desktop
- Google Chrome: current stable and previous two major versions
- Microsoft Edge: current stable and previous two major versions
- Mozilla Firefox: current stable and current ESR as a secondary compatibility target
- Apple Safari on macOS: current vendor-supported release and previous major release

### Mobile And Tablet
- Safari on current supported iPhone and iPad releases
- Chrome on supported Android releases
- Samsung Internet: current stable and previous major release
- Edge and Firefox mobile: current stable, tested for critical flows

The support window moves forward as browser vendors publish new stable versions. A release candidate is tested against the versions in scope on its release date.

Primary desktop browsers are Microsoft Edge and Google Chrome. Safari is primary
on Apple mobile devices. Firefox remains supported as a secondary browser.

## 4. Bing Compatibility
Bing is a search engine, not a web browser.

DatingEasy888 supports Bing by:
- Allowing approved public pages to be indexed
- Publishing standards-based titles, descriptions, canonical URLs, and structured metadata
- Providing a sitemap and crawler rules
- Testing that Bing search results open correctly in supported browsers
- Keeping customer profiles, chats, account pages, payment pages, and private data out of search indexing

The Microsoft browser target is Edge.

## 5. Internet Explorer Decision
Internet Explorer 11 is not supported.

Reasons:
- Microsoft ended support for the IE11 desktop application on affected Windows 10 versions on June 15, 2022.
- The retired application was permanently disabled on affected Windows systems.
- IE lacks modern web, security, accessibility, and real-time application capabilities needed by the product.
- Adding IE-specific code would increase security and maintenance risk.

Customers attempting to use IE receive a simple secure-browser notice directing them to Microsoft Edge, Chrome, or Firefox. Login, chat, payment, and personal-data forms must not operate in an unsupported IE environment.

Microsoft Edge IE mode is not a certification target because DatingEasy888 is a new public web product, not a legacy enterprise application.

## 6. Functional Compatibility Standard
All fully supported browser/OS combinations must provide:
- Registration, login, logout, and password recovery
- Profile creation and editing
- Search and discovery
- Uniform customer-facing profile presentation
- Text chat, conversation history, and reconnect behavior
- Supported image/media upload
- Block, report, mute, and consent controls
- Credits display, checkout handoff, and transaction history
- Notifications and unread state
- Account privacy and security controls
- Continued browser use without a mandatory app-install interstitial

Visual appearance may vary slightly because of fonts, form controls, scrolling, and rendering engines. Function, meaning, safety, and accessibility must remain equivalent.

## 7. Responsive Viewport Coverage
Customer Frontend supports:
- Small phone: 320 CSS pixels wide and above
- Typical phone: 360-430 CSS pixels
- Tablet: 768-1024 CSS pixels
- Laptop: 1024-1440 CSS pixels
- Large desktop: 1440 CSS pixels and above

Requirements:
- No horizontal scrolling in normal page content at supported widths.
- Text, buttons, dialogs, keyboards, and browser zoom must not overlap critical controls.
- Portrait and landscape orientations work on phones and tablets.
- Core actions do not depend on hover, right-click, or a physical keyboard.
- Touch targets remain at least 44 by 44 CSS pixels where practical.
- Layout works at 200% browser zoom and with enlarged system text for required accessibility flows.
- Mobile browser chrome, safe areas, and the on-screen keyboard do not hide the
  chat composer, send command, checkout controls, or safety actions.
- Installation banners are dismissible, remember dismissal for a reasonable
  period, and never cover a required customer command.

## 8. Implementation Compatibility Rules
- Prefer stable HTML, CSS, JavaScript, and Web Platform standards.
- Use progressive enhancement for optional browser features.
- Check feature availability rather than relying only on browser-name detection.
- Use documented polyfills only when they are maintained, reviewed, and necessary.
- Avoid browser-specific extensions and deprecated APIs.
- Transpile and bundle JavaScript according to the approved browser support matrix.
- Use CSS fallbacks where a newer feature is not essential.
- Use responsive images and supported image formats with safe fallbacks.
- Use standard Unicode and UTF-8 throughout.
- Do not assume an operating-system font is installed.
- Keyboard, pointer, touch, screen-reader, and reduced-motion behavior must be considered.

## 9. Real-Time Chat Compatibility
- Prefer a supported real-time transport such as WebSocket/SignalR.
- Provide a controlled fallback transport when WebSocket is temporarily unavailable.
- Reconnect without duplicating or losing acknowledged messages.
- Preserve unsent text during recoverable network interruption.
- Show connection state without blocking unrelated account functions.
- Test browser background/suspension behavior on mobile.

## 10. Upload And Media Compatibility
- Use browser-supported file selection on desktop and mobile.
- Support camera/gallery selection where the mobile browser provides it.
- Validate files on both client and server.
- Do not rely on image metadata or file extensions alone.
- Accept safely readable image sources and automatically produce a JPG or PNG
  derivative; use PNG when transparency must be preserved and JPG otherwise.
- Process profile and conversation pictures to fit within 100 x 100 pixels while
  preserving aspect ratio and without enlarging smaller pictures.
- Automatically transcode and compress conversation voice files.
- Show a processed preview before publish or send.
- Define accepted voice formats before implementation and test image conversion
  and voice processing across the support matrix.

## 11. Payment Compatibility
- The selected payment provider's hosted checkout must support the same primary browser matrix.
- Checkout return, cancellation, timeout, and retry flows must work across browsers.
- Browser privacy settings or blocked third-party cookies must not cause silent duplicate charging.
- Unsupported browser/payment combinations must fail before card entry with a clear alternative.

## 12. Accessibility And Input Compatibility
Critical workflows must support:
- Keyboard-only navigation
- Visible focus
- Screen-reader names and status announcements
- Browser zoom
- High contrast and increased text size
- Touch and pointer input
- Reduced-motion preference
- Autofill and password managers

Compatibility includes accessibility behavior, not only visual rendering.

## 13. Test Matrix

### Every Pull Request
- Automated standards/lint checks
- Unit and component tests
- One Chromium desktop browser
- Responsive viewport checks for small phone and desktop

### Release Candidate
- Current Chrome on Windows 10 22H2, Windows 11, and macOS
- Current Edge on Windows 10 22H2, Windows 11, and macOS
- Firefox on Windows, macOS, and representative Linux
- Safari on supported macOS
- Safari on iPhone and iPad running iOS/iPadOS 17 or later
- Chrome on representative Android phone/tablet
- Samsung Internet for critical customer flows
- Bing indexing and search-result opening for approved public pages
- 320px, 375px, 768px, 1024px, 1440px, and large-desktop layouts

### Critical Cross-Browser Flows
- Account registration and login
- Profile wizard and photo upload
- Discovery and profile presentation
- Chat send, receive, reconnect, and history
- Credits preview and hosted checkout
- Block and report
- Password reset and session revocation

Use real devices for final mobile acceptance. Device-cloud testing may expand coverage but does not entirely replace representative physical devices.

## 14. Compatibility Defect Severity
- Critical: login, payment, safety, privacy, or data loss failure on a primary supported browser
- High: core customer workflow unusable on a primary supported browser
- Medium: workaround exists or failure affects a secondary supported combination
- Low: cosmetic difference with no functional/accessibility impact

No public release may contain an open critical or high compatibility defect in a primary supported combination.

## 15. Browser Retirement
A browser/version may leave support when:
- Its vendor no longer supplies security updates
- Usage is very low and continued support imposes material risk/cost
- A required payment, identity, or security provider no longer supports it

Retirement requires:
- Usage and risk review
- Product/security approval
- Advance customer notice where practical
- Updated public support documentation
- A clear upgrade message

## Sources
- Microsoft Windows 10 end of support: https://support.microsoft.com/en-us/windows/windows-10-support-ends-on-october-14-2025-2ca8b313-1946-43d3-b55c-2b95b107f281
- Microsoft IE11 retirement: https://learn.microsoft.com/en-us/lifecycle/announcements/internet-explorer-11-end-of-support
- Microsoft Edge supported operating systems: https://learn.microsoft.com/en-us/deployedge/microsoft-edge-supported-operating-systems
- Apple macOS version list: https://support.apple.com/en-us/HT201260
- Apple iOS 17 availability and device support: https://www.apple.com/newsroom/2023/09/ios-17-is-available-today/
- Apple Safari support: https://support.apple.com/safari
