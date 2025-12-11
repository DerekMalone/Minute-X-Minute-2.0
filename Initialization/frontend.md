# Complete Architecture Guide: Sports Playbook PWA

## Project Overview

**Application Type:** Progressive Web App for sports playbook creation and team management  
**Primary Users:** Coaches (creators) and Players (viewers)  
**Core Features:** Whiteboard drawing, role-based access, offline capability, Google OAuth + email/password auth

---

## Technology Stack

### Frontend
- **Framework:** Angular 19 (latest stable as of December 2024)
- **PWA:** @angular/pwa package (included in Angular CLI)
- **State Management:** NgRx or Angular Signals (recommend Signals for simpler solo dev workflow - 6/10 complexity vs NgRx 8/10)
- **Canvas Library:** Fabric.js 6.x (better for interactive objects/selection) OR Konva.js 9.x (better performance for many objects)
- **UI Components:** Angular Material 19 (matches Angular version)
- **HTTP Client:** Built-in Angular HttpClient with interceptors
- **Forms:** Angular Reactive Forms

### Authentication
- **Provider:** Supabase Auth (managed cloud service)
- **Method:** JWT token verification
- **Flows:** Google OAuth, Email/Password, Magic Links (optional)

### Backend (Your Decision - Recommendations)
**Option A - Node.js (6/10 difficulty):**
- Express.js or Fastify
- TypeScript for type safety
- Better if you want same language as frontend

**Option B - Go (7/10 difficulty):**
- Gin or Fiber framework
- Better performance, easier Docker images (smaller size)
- Stronger typing than Node

**Option C - Python (5/10 difficulty):**
- FastAPI (modern, automatic API docs)
- Easier auth JWT verification libraries
- Slower than Go but fine for your scale

### Database (Your Decision - Recommendations)
**Option A - PostgreSQL (7/10 complexity):**
- Best for complex queries (filtering plays by team/coach/date)
- Strong JSONB support for storing canvas data
- Supabase uses Postgres (easier mental model if you switch later)
- Better for future scalability

**Option B - MongoDB (5/10 complexity):**
- Flexible schema for canvas objects
- Easier to store nested playbook data
- Faster initial development
- Harder to enforce data integrity

**Recommendation:** PostgreSQL - the relational structure of teams/coaches/players/plays fits naturally, and JSONB handles canvas data well

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Reverse Proxy:** Nginx (in Docker) for frontend serving + API routing
- **Environment Management:** Docker .env files
- **Development:** Docker volumes for hot-reload

---

## Architecture Decisions

### PWA Strategy

**Service Worker Approach:**
- **Network-first for API calls** - Try server, fallback to cache (ensures fresh data)
- **Cache-first for static assets** - Images, fonts, compiled JS/CSS
- **Stale-while-revalidate for playbook data** - Show cached, fetch update in background

**Offline Capabilities:**
1. **View existing playbooks** - Cache playbook data and canvas states
2. **Create/edit plays offline** - Store in IndexedDB, sync when online
3. **Queue actions** - Save creates/updates locally, sync when connection restored
4. **Conflict resolution** - Last-write-wins OR manual merge UI (decide based on use case)

**PWA Manifest Configuration:**
- Install prompts for mobile users
- Standalone display mode (full screen, no browser chrome)
- Custom splash screens with team branding
- Orientation: support both portrait and landscape (whiteboard needs landscape)

**Caching Strategy Files:**
- ngsw-config.json for Angular service worker configuration
- Cache versioning strategy for updates
- Background sync API for offline actions

### Authentication Flow

**Initial Setup:**
1. User lands on app
2. Check for existing Supabase session in localStorage
3. If no session, redirect to login page
4. Login page offers Google OAuth button + email/password form

**Google OAuth Flow:**
1. Click "Sign in with Google"
2. Supabase redirects to Google consent screen
3. Google redirects back to Supabase callback URL
4. Supabase redirects to your app with session
5. Angular captures session, stores tokens
6. HTTP interceptor adds JWT to all API requests

**Email/Password Flow:**
1. User enters credentials
2. Supabase validates and returns session
3. Same token storage as OAuth

**Session Management:**
- Access tokens expire (default 1 hour)
- Refresh tokens for renewal (stored in httpOnly cookies OR localStorage - consider security)
- HTTP interceptor catches 401 errors, attempts refresh, retries original request
- If refresh fails, redirect to login

**Backend Verification:**
1. Frontend sends JWT in Authorization header: `Bearer <token>`
2. Backend extracts token
3. Backend calls Supabase `/auth/v1/user` endpoint with token OR verifies JWT signature using Supabase public keys (faster, recommended)
4. Extract user ID from verified token
5. Query your database for user's role (coach/player)
6. Authorize request based on role

### Role-Based Access Control (RBAC)

**User Roles:**
- **Coach** - Can create/edit/delete plays, manage team roster
- **Player** - Can view assigned plays, cannot edit
- **Admin** (future) - Manage multiple teams, billing, etc.

**Database Schema for Roles:**
```
users table:
- id (from Supabase auth user ID)
- email
- role (coach/player)
- team_id (foreign key)
- created_at

teams table:
- id
- name
- created_by (coach user_id)
- created_at

playbooks table:
- id
- team_id
- name
- description
- created_by (user_id)
- created_at

plays table:
- id
- playbook_id
- name
- canvas_data (JSONB - stores Fabric.js or Konva.js serialized objects)
- thumbnail_url (generated image for preview)
- created_by
- created_at
- updated_at

player_access table (many-to-many):
- player_id
- playbook_id
- granted_at
```

**Authorization Checks:**
- **Frontend guards:** Angular route guards check user role before allowing navigation
- **Backend middleware:** Every API endpoint checks role + ownership
- **Example:** Player can GET /plays/:id only if they're in player_access table for that play's playbook

**Role Assignment:**
- Coaches invite players via email
- Backend creates user record with role=player, sends invite link
- Player clicks link, completes Supabase signup, auto-assigned to team

### Whiteboard Architecture

**Canvas Library Choice:**
**Fabric.js** if:
- You need complex object manipulation (grouping, locking, layers)
- Rich interaction (drag-drop, snap-to-grid)
- Built-in shapes (rectangles, circles, lines, arrows)

**Konva.js** if:
- Performance is critical (100+ objects on canvas)
- You want stage/layer architecture (easier to manage z-index)
- Better TypeScript support

**Recommendation:** Fabric.js 6.x - more features out of box for sports diagrams (arrows for player movement, text labels, etc.)

**Canvas Features to Implement:**

1. **Drawing Tools**
   - Selection tool (move/resize objects)
   - Player marker (circle with number/name)
   - Line tool (for routes/movements)
   - Arrow tool (directional movement)
   - Text tool (labels, notes)
   - Eraser tool
   - Undo/Redo stack

2. **Object Properties**
   - Color picker for team differentiation (offense red, defense blue)
   - Line thickness
   - Opacity
   - Lock/unlock objects
   - Layer ordering (bring forward, send back)

3. **Templates**
   - Pre-built formations (I-formation, shotgun, 4-3 defense, etc.)
   - Sport-specific fields (football, basketball, soccer)
   - Customizable grid/field dimensions

4. **Serialization**
   - Canvas state saved as JSON
   - Store in database as JSONB
   - Load from JSON to recreate canvas
   - Export as PNG/SVG for sharing

**Canvas Data Structure Example:**
```json
{
  "version": "6.0.0",
  "objects": [
    {
      "type": "circle",
      "left": 100,
      "top": 150,
      "radius": 20,
      "fill": "red",
      "metadata": {
        "player_number": 12,
        "position": "QB"
      }
    },
    {
      "type": "line",
      "x1": 100,
      "y1": 150,
      "x2": 300,
      "y2": 200,
      "stroke": "blue",
      "strokeWidth": 3
    }
  ],
  "background": "url_to_field_image"
}
```

**Thumbnail Generation:**
- When saving play, export canvas to PNG using canvas.toDataURL()
- Upload PNG to storage service (Firebase Storage, Supabase Storage, or S3-compatible)
- Store URL in database
- Use for playbook list view

### Real-Time Collaboration (Future Consideration)

**If coaches need simultaneous editing:**
- **WebSockets:** Socket.io or native WebSockets
- **Operational Transformation:** Handle concurrent edits (complex - 9/10 difficulty)
- **Lock-based:** Only one editor at a time (simpler - 5/10 difficulty)
- **Recommended approach:** Start without real-time, add if users request

**If NOT implementing real-time:**
- Optimistic locking: Store version number with each play
- On save, check if version changed
- If changed, show "Someone else edited this play" error
- Prompt user to refresh and try again

### API Design

**RESTful Endpoints:**

**Authentication:**
- POST /auth/verify - Verify Supabase token and return user role (called on app load)

**Users:**
- GET /users/me - Get current user profile
- PATCH /users/me - Update profile
- POST /users/invite - Coach invites player (sends email)

**Teams:**
- GET /teams - List teams (coach sees their team, player sees assigned team)
- POST /teams - Create team (coach only)
- GET /teams/:id - Get team details
- PATCH /teams/:id - Update team (coach only)
- DELETE /teams/:id - Delete team (coach only)

**Playbooks:**
- GET /playbooks - List playbooks (filtered by team + role)
- POST /playbooks - Create playbook (coach only)
- GET /playbooks/:id - Get playbook details
- PATCH /playbooks/:id - Update playbook (coach only)
- DELETE /playbooks/:id - Delete playbook (coach only)

**Plays:**
- GET /playbooks/:playbook_id/plays - List plays in playbook
- POST /playbooks/:playbook_id/plays - Create play (coach only)
- GET /plays/:id - Get play details (with canvas data)
- PATCH /plays/:id - Update play (coach only)
- DELETE /plays/:id - Delete play (coach only)
- POST /plays/:id/thumbnail - Upload thumbnail image

**Player Access:**
- POST /playbooks/:id/players - Grant player access to playbook (coach only)
- DELETE /playbooks/:id/players/:player_id - Revoke access (coach only)
- GET /playbooks/:id/players - List players with access

**Response Format:**
```json
{
  "data": { ... },
  "error": null,
  "meta": {
    "timestamp": "ISO8601",
    "version": "v1"
  }
}
```

**Error Format:**
```json
{
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You don't have permission to edit this play",
    "details": {}
  },
  "meta": { ... }
}
```

---

## Docker Configuration

### Container Architecture

**Development Setup (4 containers):**
1. **Angular Dev Server** - Hot reload enabled, port 4200
2. **Backend API** - Your chosen backend, port 3000
3. **PostgreSQL** - Database, port 5432
4. **Nginx** (optional dev) - Reverse proxy

**Production Setup (3 containers):**
1. **Nginx** - Serves compiled Angular app + proxies API requests
2. **Backend API** - Your backend
3. **PostgreSQL** - Database

### Docker Compose Structure

**Development docker-compose.yml:**
- Frontend container with volume mount to ./frontend directory for hot reload
- Backend container with volume mount to ./backend directory
- Postgres container with volume for data persistence
- Shared network for inter-container communication

**Production docker-compose.yml:**
- Nginx serves static files from multi-stage build
- Backend behind Nginx reverse proxy
- Postgres with named volume for persistence
- Health checks on all services
- Restart policies (always restart)

### Environment Variables

**Frontend (.env):**
- SUPABASE_URL
- SUPABASE_ANON_KEY (public key, safe for frontend)
- API_BASE_URL (points to backend)

**Backend (.env):**
- DATABASE_URL
- SUPABASE_URL
- SUPABASE_SERVICE_KEY (secret key for admin operations)
- JWT_SECRET (if doing additional token signing)
- PORT
- NODE_ENV (development/production)

**Database (.env):**
- POSTGRES_USER
- POSTGRES_PASSWORD
- POSTGRES_DB

### Volume Strategy

**Development:**
- Bind mounts for code (live reload)
- Named volume for node_modules (avoid Windows/Mac performance issues)
- Named volume for Postgres data

**Production:**
- No code bind mounts
- Named volume for Postgres data
- Named volume for uploaded files (if storing locally, not recommended)

### Networking

**Docker Network:**
- Create custom bridge network
- Backend can reach Postgres via service name (postgres:5432)
- Frontend reaches backend via Nginx proxy (localhost/api)

**Port Mapping:**
- Development: Map all ports for debugging
- Production: Only map 80/443 on Nginx, keep others internal

---

## Scalability Considerations

### Database Optimization

**Indexes:**
- team_id on users, playbooks, plays (queries filtered by team)
- created_by on playbooks, plays (show coach's content)
- playbook_id on plays (list plays in a playbook)
- Composite index on player_access (player_id, playbook_id) for permission checks

**Query Optimization:**
- Use JOIN instead of multiple queries for related data
- Pagination for play lists (limit 20 per page)
- Avoid SELECT * - only fetch needed columns
- Use database views for complex permission queries

**Connection Pooling:**
- Backend should use connection pool (not new connection per request)
- Pool size: Start with 10, increase based on load

### Caching Strategy

**Backend Caching:**
- Redis (future) for session data and frequently accessed playbooks
- In-memory cache for user role/permission checks (TTL 5 minutes)
- CDN for static assets and thumbnails

**Frontend Caching:**
- Service worker caches API responses
- IndexedDB for offline play storage
- LocalStorage for user preferences

### File Storage

**Thumbnail Images:**
**Don't store in your backend container** - containers are ephemeral

**Options (ranked):**
1. **Supabase Storage** - Free tier 1GB, integrated with your auth (6/10 setup)
2. **AWS S3** - Industry standard, cheap, requires AWS account (7/10 setup)
3. **Cloudflare R2** - S3-compatible, free egress, cheaper (7/10 setup)
4. **Firebase Storage** - You mentioned Firebase, easy integration (5/10 setup)

**Recommendation:** Start with Supabase Storage since you're using their auth

**Implementation:**
- Generate thumbnail in frontend (canvas.toDataURL)
- Upload directly to Supabase Storage from frontend (faster, no backend bottleneck)
- Supabase returns public URL
- Store URL in your database
- Serve via Supabase CDN

### Load Considerations

**Current Scale (MVP):**
- 10-50 teams
- 500-1000 users
- Single backend container handles this easily

**Future Scale (Success Scenario):**
- 1000+ teams
- 10,000+ users
- Considerations:
  - Horizontal backend scaling (multiple containers behind load balancer)
  - Read replicas for database (separate read/write connections)
  - Redis for distributed session management
  - Separate storage service becomes critical

**Monitoring:**
- Application logs in Docker (docker logs)
- Backend request logging (response times, error rates)
- Database slow query log
- Future: Prometheus + Grafana for metrics

---

## Community Features (Future)

### Feature Ideas

**Social Aspects:**
- Public playbook sharing (coach marks playbook as public)
- Comment system on plays
- Like/favorite plays
- Follow other coaches
- Activity feed (new plays from followed coaches)

**Discovery:**
- Search public playbooks by sport/level/formation
- Trending plays (most liked/viewed this week)
- Featured coaches

**Collaboration:**
- Teams can have multiple coaches
- Co-editing permissions
- Playbook templates from community

### Technical Implications

**Database Changes:**
- playbooks.visibility (private/public)
- comments table (user_id, play_id, text, created_at)
- likes table (user_id, play_id)
- follows table (follower_id, followee_id)
- activity_feed table (user_id, action_type, resource_id, created_at)

**API Endpoints:**
- GET /explore/playbooks - Public playbook feed
- POST /plays/:id/like - Like a play
- GET /plays/:id/comments - Comment thread
- POST /users/:id/follow - Follow coach

**Moderation:**
- Report system (reports table)
- Admin dashboard for reviewing reports
- Auto-hide content with X reports
- Ban user functionality

**Performance:**
- Caching becomes critical for public feeds
- Consider denormalization (store like_count on plays table)
- Background jobs for activity feed generation (don't slow down UI)

---

## Development Roadmap

### Phase 1: MVP (Weeks 1-6)
**Goal:** Single coach can create plays, invite players to view

**Week 1-2: Infrastructure**
- Docker setup (frontend, backend, database)
- Angular project with PWA
- Supabase auth integration (Google OAuth + email)
- Basic routing (login, dashboard, playbook list)

**Week 3-4: Core Features**
- Whiteboard component (Fabric.js integration)
- Basic drawing tools (player markers, lines, text)
- Save/load canvas state to database
- Thumbnail generation

**Week 5: RBAC**
- User roles in database
- Coach/player differentiation
- Route guards
- API authorization middleware

**Week 6: Polish**
- Offline support (service worker config)
- Error handling
- Loading states
- Mobile responsive design

### Phase 2: Team Management (Weeks 7-9)
- Multiple playbooks per team
- Player invitation system
- Granular playbook access control
- Team roster management UI
- Export plays as images

### Phase 3: Enhanced Whiteboard (Weeks 10-12)
- More drawing tools (arrows, shapes)
- Templates (formations, field backgrounds)
- Layers and grouping
- Undo/redo
- Copy/paste objects
- Animation preview (optional - show play sequence)

### Phase 4: Community (Weeks 13+)
- Public playbook sharing
- Search and discovery
- Comments and likes
- Follow system
- Moderation tools

---

## Security Considerations

### Frontend Security

**Token Storage:**
- **Option A:** LocalStorage (easier, vulnerable to XSS)
- **Option B:** httpOnly cookies (more secure, requires backend to set)
- **Recommendation:** LocalStorage for MVP, move to httpOnly cookies if handling sensitive data

**XSS Prevention:**
- Angular sanitizes templates by default
- Never use innerHTML with user content
- Sanitize canvas text objects (users can inject scripts in text labels)

**CSRF Protection:**
- Not needed if using JWT in Authorization header (no cookies)
- If using cookies, implement CSRF tokens

### Backend Security

**JWT Verification:**
- Verify signature using Supabase public keys
- Check expiration time
- Validate issuer (should be Supabase)

**Input Validation:**
- Validate all request bodies (use validation library like Joi, Zod)
- Sanitize inputs before database queries
- Limit canvas data size (prevent DOS by uploading huge JSON)

**Rate Limiting:**
- Limit API requests per user (e.g., 100 requests/minute)
- Prevents abuse and DOS attacks
- Use in-memory rate limiter (express-rate-limit) or Redis

**SQL Injection:**
- Use parameterized queries (prepared statements)
- Never concatenate user input into SQL strings
- ORM (like Prisma, TypeORM) handles this automatically

### Database Security

**Access Control:**
- Backend connects with limited privilege user (not superuser)
- User can only read/write app tables, not system tables
- Network isolation (Postgres only accessible within Docker network)

**Sensitive Data:**
- Don't store passwords (Supabase handles this)
- Hash any additional secrets (use bcrypt)
- Encrypt sensitive fields if storing (unlikely for your app)

**Backups:**
- Automated daily backups of Postgres data volume
- Store backups outside Docker host
- Test restore process

### HTTPS/SSL

**Development:**
- HTTP is fine (localhost)

**Production:**
- HTTPS required for PWA (browsers enforce this)
- Use Let's Encrypt for free SSL certificates
- Nginx handles SSL termination
- Auto-renew certificates (certbot)

---

## Testing Strategy

### Frontend Testing

**Unit Tests:**
- Angular services (auth service, API service)
- Components (whiteboard tools, form validation)
- Pipes and utility functions
- Use Jasmine + Karma (Angular defaults)

**Integration Tests:**
- User flows (login → create play → save)
- API integration (mocked responses)
- Route guard behavior

**E2E Tests:**
- Critical paths (signup, create first play, invite player)
- Use Playwright (better than Protractor/Cypress for Angular)
- Run in Docker for consistency

### Backend Testing

**Unit Tests:**
- Authorization middleware
- JWT verification
- Business logic functions

**Integration Tests:**
- API endpoints (request/response)
- Database operations
- Error handling

**Load Tests (future):**
- Use k6 or Apache JMeter
- Test concurrent users editing plays
- Identify bottlenecks

### Manual Testing Checklist

**PWA Features:**
- Install prompt appears on mobile
- App works offline (view cached plays)
- Background sync (create play offline, syncs when online)
- Notifications (future - new play assignments)

**Cross-Browser:**
- Chrome (primary)
- Safari (iOS PWA support differs)
- Firefox
- Edge

**Cross-Device:**
- Desktop (1920x1080, 1366x768)
- Tablet (iPad, Android tablet)
- Mobile (iOS, Android - various screen sizes)

---

## Deployment Considerations

### Hosting Options

**Backend + Database:**
1. **DigitalOcean Droplet** - $6/month, full control, good for learning Docker (7/10 complexity)
2. **AWS EC2 + RDS** - More scalable, more expensive, steeper learning curve (8/10 complexity)
3. **Railway.app** - Deploys Docker Compose, managed Postgres, free tier (5/10 complexity)
4. **Fly.io** - Good for Docker apps, free tier, global distribution (6/10 complexity)
5. **Google Cloud Run** - Serverless containers, pay per request (7/10 complexity)

**Recommendation for solo dev:** Railway.app or Fly.io - easiest Docker deployment

**Frontend (Static Files):**
1. **Netlify** - Free tier, built-in CDN, easy Angular deploy (3/10 complexity)
2. **Vercel** - Similar to Netlify, optimized for frontend frameworks (3/10 complexity)
3. **Cloudflare Pages** - Free, fast CDN, good for PWA (4/10 complexity)
4. **Firebase Hosting** - You mentioned Firebase, easy setup (3/10 complexity)

**Recommendation:** Cloudflare Pages - free, excellent PWA support, fast global CDN

**Why separate frontend hosting?**
- CDN distribution (faster load times globally)
- Frontend can scale independently
- Backend only handles API traffic (cheaper)
- Static files don't hit your Docker containers

### CI/CD Pipeline

**GitHub Actions (recommended):**

**Frontend Pipeline:**
1. Trigger on push to main
2. Install dependencies
3. Run ESLint
4. Run unit tests
5. Build Angular for production (ng build)
6. Deploy to Cloudflare Pages

**Backend Pipeline:**
1. Trigger on push to main
2. Install dependencies
3. Run linter
4. Run unit tests
5. Build Docker image
6. Push to Docker Hub or GitHub Container Registry
7. Deploy to Railway/Fly.io (trigger new deployment)

**Database Migrations:**
- Use migration tool (Prisma Migrate, Knex, or raw SQL files)
- Run migrations before deploying new backend version
- Keep migrations in version control

### Monitoring & Logging

**Application Logs:**
- Backend logs to stdout (Docker collects)
- Use structured logging (JSON format)
- Include request ID for tracing

**Error Tracking:**
- Sentry (free tier for small projects)
- Captures frontend and backend errors
- Shows stack traces and user context

**Uptime Monitoring:**
- UptimeRobot (free tier)
- Pings your API every 5 minutes
- Email alerts if down

**Analytics (optional):**
- Plausible or Fathom (privacy-friendly)
- Track page views, feature usage
- No personal data collection (GDPR friendly)

---

## Performance Optimization

### Frontend Optimization

**Angular Build Optimizations:**
- Production build with --optimization flag
- Ahead-of-time (AOT) compilation (Angular default)
- Tree shaking (removes unused code)
- Lazy loading for routes (load whiteboard component only when needed)

**Bundle Size:**
- Analyze with webpack-bundle-analyzer
- Code split by route
- Lazy load Fabric.js (heavy library, ~500KB)
- Use CDN for Angular Material icons

**Image Optimization:**
- Compress thumbnails (use WebP format, fallback to PNG)
- Lazy load images in playbook list
- Responsive images (srcset for different screen sizes)

### Backend Optimization

**Response Times:**
- Keep API responses under 200ms (target)
- Use database indexes (mentioned earlier)
- Avoid N+1 queries (use JOINs or batch loading)
- Compress responses (gzip middleware)

**Payload Size:**
- Paginate large lists
- Only return needed fields (use query params like ?fields=id,name)
- Compress canvas JSON (browser supports gzip)

### Database Optimization

**Query Performance:**
- EXPLAIN ANALYZE slow queries
- Add indexes where needed
- Denormalize if necessary (store computed values)
- Use database views for complex joins

**Connection Management:**
- Pool size based on max concurrent requests
- Close connections properly (use finally blocks)
- Monitor active connections

---

## Additional Considerations

### Accessibility (a11y)

**WCAG 2.1 Compliance:**
- Keyboard navigation (whiteboard tools accessible via keyboard)
- ARIA labels on canvas objects
- Color contrast ratios (4.5:1 for text)
- Screen reader support (describe play diagrams in text)
- Focus indicators on interactive elements

**Testing:**
- Use axe DevTools browser extension
- Test with screen reader (NVDA on Windows, VoiceOver on Mac)
- Keyboard-only navigation testing

### Internationalization (i18n)

**Future consideration:**
- Angular i18n support built-in
- Translate UI strings (not urgent for MVP)
- Support multiple sports (football vs. soccer terminology)
- Date/time formatting (local timezone)

### Legal Compliance

**GDPR (if EU users):**
- Cookie consent (if using analytics cookies)
- Privacy policy
- Right to deletion (delete user data on request)
- Data export (export user's playbooks)

**COPPA (if under-13 users):**
- Age verification
- Parental consent
- Limited data collection

**Terms of Service:**
- User content ownership
- Acceptable use policy
- Liability disclaimers

### Documentation

**User Documentation:**
- Onboarding tutorial (first-time user walkthrough)
- Help center (how to create plays, invite players)
- Video tutorials (screen recordings)

**Developer Documentation:**
- API documentation (use OpenAPI/Swagger)
- Database schema diagram
- Architecture decision records (ADRs)
- Setup guide for new developers

---

## Cost Estimates (Monthly)

### MVP Scale (100 users, 50 teams)

**Supabase Auth:** Free tier (50k MAU)  
**Database Hosting (Railway):** $5-10  
**Backend Hosting (Railway):** $5  
**Frontend Hosting (Cloudflare):** Free  
**Storage (Supabase):** Free (1GB)  
**Domain Name:** $1/month (Google Domains)  
**SSL Certificate:** Free (Let's Encrypt)  

**Total:** $11-16/month

### Growth Scale (1000 users, 500 teams)

**Supabase Auth:** Free (still under 50k MAU)  
**Database Hosting:** $25-50 (larger instance)  
**Backend Hosting:** $20 (multiple containers)  
**Frontend Hosting:** Free (CDN handles traffic)  
**Storage:** $2-5 (10-20GB images)  
**Monitoring (Sentry):** Free tier  

**Total:** $47-77/month

### Profitable Scale (10k users)

**Supabase Auth:** $25 (over 50k MAU, paid tier)  
**Database:** $100-200 (managed Postgres, read replicas)  
**Backend:** $50-100 (horizontal scaling)  
**Storage:** $20-50 (200GB+)  
**CDN:** $10-20 (high traffic)  
**Monitoring:** $20 (paid Sentry)  

**Total:** $225-415/month

---

## Risk Mitigation

### Technical Risks

**Risk: Fabric.js learning curve**  
**Mitigation:** Allocate 1 week for prototyping, evaluate Konva.js as backup (8/10 chance of success with Fabric.js)

**Risk: Offline sync conflicts**  
**Mitigation:** Start with last-write-wins, add manual merge UI if users complain (6/10 complexity)

**Risk: Mobile canvas performance**  
**Mitigation:** Test early on low-end Android device, optimize object count, add "reduce quality" mode (7/10 chance of issues)

**Risk: Docker complexity for solo dev**  
**Mitigation:** Use Docker Compose templates, Railway/Fly.io abstracts Docker management (4/10 complexity with managed platforms)

### Business Risks

**Risk: Users don't want to install PWA**  
**Mitigation:** Works as regular web app, installation optional (5/10 concern)

**Risk: Free tier limits exceeded**  
**Mitigation:** Monitor usage, add rate limiting early, plan upgrade path (6/10 likelihood if successful)

**Risk: Competitor launches similar product**  
**Mitigation:** Focus on niche (specific sport, youth leagues), add unique features (templates, community) (7/10 likelihood - market exists)

---

## Success Metrics

### MVP Success Criteria (3 months)

- 10 active coaches
- 50 plays created
- 5 teams with 5+ players each
- <3 critical bugs reported
- 90% uptime
- Average load time <2 seconds

### Product-Market Fit (6 months)

- 50 active coaches
- 20% weekly active user rate
- 100+ plays created per week
- Positive user feedback (NPS score >30)
- At least 1 coach paying for premium features

### Growth Stage (12 months)

- 200+ active coaches
- 1000+ players
- 10k+ plays created
- Revenue covers hosting costs
- <5% churn rate

---