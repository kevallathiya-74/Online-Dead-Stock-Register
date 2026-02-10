No temporary fixes.
No silent failures.
No repeated runtime errors.
Root cause must always be fixed.
One global change must update the entire app.
User safety and data integrity are top priority.
If a solution does not permanently prevent the same issue, it is NOT acceptable.❌ Duplicate implementations are forbidden
❌ Partial abstractions are forbidden
✅ One file controls the entire systemRequest Validation (Backend)
Every API request must validate:
Required fields
Data types
Data length
Invalid requests must return proper HTTP codes:
400 – Bad Request
401 – Unauthorized
403 – Forbidden
404 – Not Found
429 – Too Many Requests
500 – Server Error
9. API Rate Limiting & Security (MANDATORY)
Backend must implement rate limiting:
Protect auth endpoints
Prevent brute-force attacks
Example limits:
Auth: limited attempts per IP
APIs: request-per-minute limit
All APIs must include:
Proper CORS headers
Secure headers (no sensitive exposure)
Secrets must never be committed to Git.
10. Error Handling & User Messaging Rules
10.1 Backend Errors
Backend must return structured error responses.
Error messages must be:
Clear
Non-technical
Safe (no internal details)
10.2 Frontend Errors
Frontend must show user-friendly messages.
Raw backend or JS errors must NEVER be shown to users.
Errors must guide the user:
What happened
What to do next
 Navigation Rules
Every navigation route must point to an existing screen.
No dead routes or unused screens.
Navigation must respect auth state.
No navigation logic inside reducers.Unused files must be deleted.
Duplicate code must be merged. & not used file delete 
Unused exports must be removed.
Folder structure must remain clean and intentional.
Health check must show:

Syntax Errors: 0
Runtime Errors: 0
Duplicate Code: 0
Unused Exports: 0


proper session management 