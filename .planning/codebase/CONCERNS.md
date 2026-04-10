# Concerns & Potential Issues
- **Date & Timestamps:** History of issues with 00:00 timestamp offsets and timezone mapping (Resolved but requires awareness).
- **Legacy Migrations:** Ensure no WPF desktop-specific logic bleeds into the RESTful API architecture.
- **Pagination State:** Need to ensure server-client pagination works dynamically for edge cases in Certificate grids.
- **CORS:** Ensure endpoints remain accessible for the separate Vite frontend during local dev and production builds.
