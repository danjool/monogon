# Flying Carpet Multiplayer Architecture

## Overview

**Goal**: 2-8 players flying carpets together in same inside-out world, sharing exploration and collaborative 3D minesweeper solving.

**Philosophy**: Simple, low bandwidth, social exploration focus.

## Development Setup

```mermaid
graph TB
    subgraph "192.168.4.25 (Dev Machine)"
        FrontServ[python -m http.server 8000]
        BackServ[node server.js :3001]
    end
    
    subgraph "192.168.4.x (Client Machine 1)"
        Browser1[Browser<br/>→ 192.168.4.25:8000]
    end
    
    subgraph "192.168.4.y (Client Machine 2)" 
        Browser2[Browser<br/>→ 192.168.4.25:8000]
    end
    
    subgraph "localhost (Dev Testing)"
        DevBrowser[Dev Browser<br/>→ localhost:8000]
    end
    
    Browser1 -->|HTTP| FrontServ
    Browser2 -->|HTTP| FrontServ
    DevBrowser -->|HTTP| FrontServ
    
    Browser1 -.->|WebSocket| BackServ
    Browser2 -.->|WebSocket| BackServ
    DevBrowser -.->|WebSocket| BackServ
    
    classDef devmachine fill:#e1f5fe
    classDef clientmachine fill:#e8f5e8
    classDef localhost fill:#fff3e0
    
    class FrontServ,BackServ devmachine
    class Browser1,Browser2 clientmachine
    class DevBrowser localhost
```

## Production Setup

```mermaid
graph TB
    subgraph "Vercel/Netlify"
        FrontendHost[Static Files<br/>monogon.net/carpet/]
    end
    
    subgraph "Railway/DigitalOcean"
        BackendHost[Node.js Server<br/>ws.monogon.net]
    end
    
    subgraph "CloudFlare"
        CDN[Global CDN<br/>Static Assets]
    end
    
    subgraph "Client Device 1"
        Browser1[Browser<br/>→ monogon.net/carpet/]
    end
    
    subgraph "Client Device 2"
        Browser2[Browser<br/>→ monogon.net/carpet/]
    end
    
    subgraph "Client Device N"
        BrowserN[Browser<br/>→ monogon.net/carpet/]
    end
    
    FrontendHost --> CDN
    
    Browser1 -->|HTTPS| CDN
    Browser2 -->|HTTPS| CDN
    BrowserN -->|HTTPS| CDN
    
    Browser1 -.->|WSS| BackendHost
    Browser2 -.->|WSS| BackendHost
    BrowserN -.->|WSS| BackendHost
    
    classDef hosting fill:#e1f5fe
    classDef cdn fill:#f3e5f5
    classDef client fill:#e8f5e8
    
    class FrontendHost,BackendHost hosting
    class CDN cdn
    class Browser1,Browser2,BrowserN client
```

## Data Flow & Synchronization

### Message Types & Frequency

| Type | Frequency | Direction | Purpose |
|------|-----------|-----------|---------|
| `carpet_update` | 20fps | Client→Server→All | Position/orientation sync |
| `mine_click` | Event | Client→Server→All | Minesweeper interactions |
| `carpet_color` | ~1fps | Client→Server→All | Appearance changes |
| `game_reset` | Event | Server→All | Auto-reset after game over |
| `player_joined/left` | Event | Server→All | Lobby management |

### Key Implementation Files

**New Files:**
- `multiplayer-manager.js` - WebSocket client & state sync
- `other-player.js` - Render other players' carpets  

**Modified Files:**
- `sweeper.js` - Network-aware minesweeper (server authoritative)
- `carpet-flow-field.js` - Multi-player particle emission
- `main.js` - Multiplayer integration & update loop

### Core Features

**Shared World:**
- Collaborative 3D minesweeper (server authoritative)
- Real-time carpet position/orientation sync
- Particle trails from all players
- Auto-generated hacker names (CyberPilot42, etc.)

**Networking:**
- Socket.IO for reliable WebSocket communication
- 20fps position updates, event-based game state
- Late joiner sync support
- Auto-reconnection handling

**Scalability:**
- 2-8 players per session
- Room system ready for future expansion
- Client-side particle simulation (no sync needed)
- Bandwidth ~5KB/s per player