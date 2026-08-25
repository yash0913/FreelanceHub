# services/

This folder will house frontend API service integration helper classes:
- `api.js` - Central Axios configuration file setting base URL, default headers, interceptors for JWT injection, and unified error handling.
- `authService.js` - Service class wrapper for `/api/v1/auth` login, signup, logout endpoints.
- `jobService.js` - Service class wrapper for `/api/v1/jobs` list, details, submit endpoints.
- `profileService.js` - Service class wrapper for freelancer profiles.
- `proposalService.js` - Service class wrapper for job proposals.
- `contractService.js` - Service class wrapper for active marketplace projects.
