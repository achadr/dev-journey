# Database Setup Instructions


### Step 1: Start PostgreSQL Docker Container

```bash
docker run --name packet-journey-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=packet_journey -p 5432:5432 -d postgres:17
```

**Verify it's running:**
```bash
docker ps
```

You should see `packet-journey-db` in the list.

---

### Step 2: Create `.env.local` File

Create a file called `.env.local` in the project root with:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/packet_journey"
```

---

### Step 3: Generate Prisma Client

```bash
pnpm db:generate
```

---

### Step 4: Run Database Migration

```bash
pnpm db:migrate
```

When prompted for a migration name, enter: `init`

---

### Step 5: Seed the Database

```bash
pnpm db:seed
```

This will create:
- Admin user: `admin@packetjourney.com` / `admin123`
- Test user: `test@example.com` / `test123`
- 2 sample quests with all 4 layers
- 4 achievements

---

##  Verification

**Check the database:**
```bash
pnpm db:studio
```

This opens Prisma Studio at http://localhost:5555 where you can browse your data!

---

## Useful Commands

```bash
# Start the container (if stopped)
docker start packet-journey-db

# Stop the container
docker stop packet-journey-db

# View container logs
docker logs packet-journey-db

# Remove container (if you want to start fresh)
docker rm -f packet-journey-db

# View database in GUI
pnpm db:studio
```

---

## Database Schema Overview

**Models:**
- `User` - Player accounts with roles (PLAYER, CREATOR, ADMIN)
- `Quest` - Game quests with metadata
- `Layer` - Individual layers within quests (BROWSER, NETWORK, API, DATABASE)
- `Challenge` - Challenge configurations (flexible JSON config)
- `Progress` - Player progress tracking
- `LayerProgress` - Layer-specific progress
- `Achievement` - Available achievements
- `UserAchievement` - Unlocked achievements
- `LeaderboardEntry` - Materialized leaderboard data

---

## Next Steps After Setup

1. Database is running and seeded
2. Ready to implement API endpoints (Backend Agent)
3. Ready to build game scenes (Game Engine Agent)
4. Ready to create UI components (Frontend Agent)

---

## Troubleshooting

**Port 5432 already in use:**
```bash
# Use a different port
docker run --name packet-journey-db ... -p 5433:5432 ...

# Update DATABASE_URL:
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/packet_journey"
```

**Can't connect to database:**
- Make sure Docker Desktop is running
- Check if container is running: `docker ps`
- Check container logs: `docker logs packet-journey-db`

**Migration fails:**
- Make sure `.env.local` exists with correct DATABASE_URL
- Make sure container is running
- Try: `docker restart packet-journey-db`
