# System Architecture

This document provides a high-level overview of the Online Dead Stock Register's architecture, demonstrating the strict separation of concerns through our monorepo structure and the use of our Supabase (PostgreSQL) data layer.

## High-Level Architecture

The system follows a modern client-server architecture with a strict separation between the React frontend and the Express backend, backed by Supabase for the database layer.

```mermaid
graph TD
    %% Entities
    User((User))
    Vendor((Vendor))
    Admin((Admin))
    Auditor((Auditor))
    
    %% Frontend
    subgraph Frontend [React Frontend - Vite]
        UI[User Interface / Tailwind CSS / MUI]
        State[Redux & TanStack Query]
        Router[React Router]
        Service[Axios API Client]
        
        UI --> State
        UI --> Router
        State --> Service
    end
    
    %% Backend
    subgraph Backend [Express Backend - Node.js]
        API[API Gateway / Router]
        Auth[JWT Authentication]
        Controllers[Feature Controllers]
        Services[Business Logic Services]
        SupabaseClient[Supabase Server Client]
        
        API --> Auth
        Auth --> Controllers
        Controllers --> Services
        Services --> SupabaseClient
    end
    
    %% Database and Cache
    subgraph Infrastructure [Data Layer]
        DB[(PostgreSQL / Supabase)]
        Cache[(Redis Cache)]
    end
    
    %% Connections
    User --> UI
    Vendor --> UI
    Admin --> UI
    Auditor --> UI
    
    Service -- "REST API (JSON) over HTTPS" --> API
    SupabaseClient -- "PostgreSQL Client Protocol" --> DB
    Services -- "Cache Lookups" --> Cache
```

## Monorepo Directory Structure

The project has been reorganized into an enterprise-grade monorepo to isolate environments and simplify deployments.

```mermaid
graph TD
    Root[Online-Dead-Stock-Register/]
    
    %% Frontend
    Root --> Frontend[frontend/]
    Frontend --> F_Src[src/]
    F_Src --> F_Feat[features/]
    F_Feat --> F_Admin[admin/]
    F_Feat --> F_Users[users/]
    F_Feat --> F_Vendors[vendors/]
    F_Src --> F_Core[core/]
    F_Core --> F_Hooks[hooks/]
    F_Core --> F_Store[store/]
    F_Core --> F_Utils[utils/]
    F_Src --> F_Shared[shared/components/]
    
    %% Backend
    Root --> Backend[backend/]
    Backend --> B_Routes[routes/]
    Backend --> B_Controllers[controllers/]
    Backend --> B_Services[services/]
    Backend --> B_Middleware[middleware/]
    Backend --> B_Utils[utils/]
    
    %% Configs
    Root --> Configs[.agents/]
    Root --> Readme[README.md]
    Root --> Arch[SYSTEM_ARCHITECTURE_DIAGRAM.md]
```

## Security & Data Flow

```mermaid
sequenceDiagram
    participant Client as React App
    participant Middleware as Auth Middleware
    participant Controller as Express Controller
    participant Service as Business Service
    participant Supabase as Supabase (PostgreSQL)

    Client->>Middleware: HTTP Request with JWT
    
    alt Invalid Token
        Middleware-->>Client: 401 Unauthorized
    else Valid Token
        Middleware->>Controller: Request (req.user payload)
        Controller->>Service: Call Domain Logic
        Service->>Supabase: Supabase Client Query
        Supabase-->>Service: Data / Error
        Service-->>Controller: Processed Result
        Controller-->>Client: HTTP 200 / 201 Response (JSON)
    end
```

## Deployment Architecture

```mermaid
graph LR
    GitHub[GitHub Repository]
    
    subgraph Vercel [Vercel - Edge CDN]
        V_Hosting[Static Frontend Hosting]
    end
    
    subgraph Render [Render - Cloud Platform]
        R_Server[Node.js Express Server]
    end
    
    subgraph SupabaseCloud [Supabase Cloud]
        S_DB[(Managed PostgreSQL Database)]
        S_Storage[Blob Storage]
    end
    
    GitHub -- "Push / Webhook" --> Vercel
    GitHub -- "Push / Webhook" --> Render
    
    V_Hosting -- "REST API Calls" --> R_Server
    R_Server -- "PostgreSQL Connection" --> S_DB
    R_Server -- "File Uploads" --> S_Storage
```
