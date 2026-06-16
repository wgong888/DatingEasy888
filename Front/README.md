# Front Folder Map

Purpose: customer-facing browser UI.

Main files:
- `index.html`: customer pages, dialogs, navigation, forms.
- `app.js`: customer UI behavior and API calls.
- `styles.css`: customer responsive layout and visual styling.

Primary role:
- Customer.

Common tasks:
- Customer login/register/recovery: `index.html` auth forms, `app.js` auth submit handlers.
- Discover/search/favorites/profile view: `app.js` profile loading and rendering functions.
- Messages/chat/gifts: `app.js` conversation, composer, gift, and credit handlers.
- Mobile behavior: `styles.css` mobile media queries and `app.js` menu/chat-close handlers.

Before changing:
- Run `node -c Front/app.js`.
- For UI behavior, run `npm run test:browser` or `npm run verify`.
