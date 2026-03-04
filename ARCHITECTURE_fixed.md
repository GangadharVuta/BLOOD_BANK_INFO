```mermaid
%%{init: {"theme":"default","flowchart":{"curve":"basis"}}}%%
graph TB
    subgraph Client
        A[React SPA<br/>(blood-bank-react)]
    end

    subgraph Server
        B[Node/Express API<br/>(blood-bank-node)]
        B --> C[Authentication Module]
        B --> D[Donor Module]
        B --> E[Request Module]
        B --> F[User Module]
        B --> G[OTP Module]
        B --> H[Common Services / Utils]
        B --> I[Configs (express, mongoose, firebase)]
    end

    subgraph Data
        J[MongoDB<br/>(via mongoose)]
        K[Firebase<br/>(Auth / Messaging)]
    end

    A -- REST/JSON --> B
    B -- mongoose --> J
    B -- SDK/API --> K
    A -- Firebase SDK --> K
```
