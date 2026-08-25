# middleware/

This folder houses application-wide Express interception blocks:
- `authMiddleware.js` - Inspects JWT headers, validates signatures, and populates `req.user`.
- `roleGuard.js` - Restricts endpoints to specific accounts types (e.g., `requireRole('ADMIN')`).
- `validator.js` - Inspects payload parameters using validation frameworks before controller activation.
- `errorHandler.js` - Unified custom HTTP response mapping for thrown errors.
