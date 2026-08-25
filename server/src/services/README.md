# services/

This folder houses the core business services. These service files contain transaction code and query wrappers:
- `authService.js` - Computes login checks and crypt hashes.
- `userService.js` - Manages user accounts details.
- `freelancerService.js` - Performs bio updates and filters search results.
- `jobService.js` - Posts jobs and implements search filters.
- `proposalService.js` - Submits and processes bids.
- `projectService.js` - Operates contract workflows.
- `reviewService.js` - Submits scores and recalculates ratings averages.
- `adminService.js` - Manages moderation queues.
- `nlpService.js` - Parses plain-text search inputs using semantic rules.
- `sqlGenerationService.js` - Dynamically creates secure sql search strings from semantic results.
