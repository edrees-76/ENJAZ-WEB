# Architecture Overview
- **System Type:** Hybrid SPA + REST API (Migrated from Monolithic WPF)
- **Data Flow:** React Frontend -> HTTP requests -> ASP.NET API Controllers -> Services layer -> EF Core Data Layer -> SQLite
- **Backend Architecture:** Typical 3-layer MVC API architecture separating routes (Controllers), logic (Services), and database entities (Models).
- **Frontend Architecture:** SPA structured with components and API fetching logic targeting `localhost` backend ports.
