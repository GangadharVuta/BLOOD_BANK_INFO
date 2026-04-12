# 📊 Post-Deployment Monitoring & Security Setup Guide

> **Status**: Medium Priority - Can be done after deployment with monitoring
> **Implementation Timeline**: 1-2 weeks after initial deployment
> **Prerequisites**: Application running in production, basic monitoring infrastructure

---

## 🎯 Overview of Tasks

This guide covers 7 medium-priority post-deployment improvements:

| Task | Priority | Effort | Value | Sync |
|------|----------|--------|-------|------|
| 1. Remove build from git | ✅ HIGH | 15 min | Important | Done |
| 2. CSRF Protection | ✅ STARTED | 30 min | Critical | Partial |
| 3. API Documentation (Swagger) | ✅ STARTED | 1 hour | High | Partial |
| 4. Performance Monitoring | ✅ CREATED | 2 hours | High | Partial |
| 5. Error Tracking (Sentry) | 📋 GUIDE | 2 hours | Critical | Instructions |
| 6. Security Scanning | 📋 GUIDE | 1 hour | Medium | Instructions |
| 7. Monitoring Stack | 📋 GUIDE | 4 hours | High | Instructions |

---

## 1. ✅ Remove Build Folder from Git

**Status**: COMPLETE

### What was done:
- Updated `blood-bank-react/.gitignore` with comprehensive build artifacts
- Excludes: `/build`, `/dist`, `/node_modules`, `.env` files, logs, cache

### How to remove existing committed builds:

```bash
# Remove build folder from git history (if already committed)
cd blood-bank-react
git rm -r --cached build/
git commit -m "Remove build folder from git"
git push
```

### Result:
- Production builds no longer take up git repository space
- Build artifacts (100MB+) excluded from version control
- Faster clones and git operations

---

## 2. 🔒 CSRF Protection Implementation

**Status**: Framework created, requires integration

### What was created:
- **File**: `blood-bank-node/middleware/csrfProtection.js`
- Provides double-submit cookie CSRF protection
- Token generation endpoint
- Error handling middleware

### Implementation Steps:

#### Step 1: Update `blood-bank-node/configs/express.js`

Add at the top with other middleware:

```javascript
const { csrfProtection, csrfErrorHandler } = require('../middleware/csrfProtection');
const cookieParser = require('cookie-parser');

// Add to middleware setup (order matters!)
app.use(cookieParser());
app.use(csrfProtection);
```

#### Step 2: Add CSRF token endpoint

In your main routes file (e.g., `blood-bank-node/server.js` or main Routes.js):

```javascript
const { getCsrfToken } = require('./middleware/csrfProtection');

// Add route to get CSRF token
app.get('/api/csrf-token', getCsrfToken);
```

#### Step 3: Add error handler

In `blood-bank-node/configs/express.js` (at the END of middleware):

```javascript
const { csrfErrorHandler } = require('../middleware/csrfProtection');

// Add after all other middleware and routes
app.use(csrfErrorHandler);
```

#### Step 4: Update React to use CSRF tokens

In `blood-bank-react/src/services/api.js` or similar:

```javascript
// Get CSRF token on app load
async function fetchCsrfToken() {
  try {
    const response = await fetch('/api/csrf-token');
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }
}

// Add token to all POST/PUT/DELETE requests
axios.interceptors.request.use((config) => {
  if (['post', 'put', 'delete'].includes(config.method)) {
    config.headers['X-CSRF-Token'] = localStorage.getItem('csrfToken');
  }
  return config;
});
```

### Security Features:
- ✅ Prevents Cross-Site Request Forgery attacks
- ✅ HTTP-only cookies (can't be accessed by JavaScript)
- ✅ Secure in production (HTTPS only)
- ✅ SameSite strict mode for cookie handling
- ✅ 1-hour token expiration

---

## 3. 📚 API Documentation (Swagger/OpenAPI)

**Status**: Framework created, requires route documentation

### What was created:
- **File**: `blood-bank-node/configs/swagger.js`
- Auto-generates interactive API documentation
- Hosted at `/api/docs`
- OpenAPI 3.0.0 specification

### Integration Steps:

#### Step 1: Update `blood-bank-node/server.js`

```javascript
const { setupSwagger } = require('./configs/swagger');

// ... other setup code ...

// Setup Swagger documentation BEFORE error handlers
setupSwagger(app);

// Setup routes AFTER Swagger
const authentication = require('./app/modules/Authentication/Routes');
authentication(app, express);

// ... other routes ...
```

#### Step 2: Add JSDoc comments to routes

In each Routes.js file, add Swagger documentation:

```javascript
/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/users/register', registerLimiter, validation.validateRegister, (req, res, next) => {
  // ... controller code ...
});
```

### Benefits:
- ✅ Interactive API playground
- ✅ Automatic request/response documentation
- ✅ Server-generated from source code
- ✅ Available at `http://localhost:4000/api/docs`
- ✅ Exports OpenAPI spec at `/api/docs.json`

---

## 4. 📈 Performance Monitoring

**Status**: Framework created, requires Express integration

### What was created:
- **File**: `blood-bank-node/utils/performanceMonitor.js`
- Tracks response times, slow requests, error rates
- Provides metrics dashboard
- Health check endpoint

### Integration Steps:

#### Step 1: Update `blood-bank-node/configs/express.js`

```javascript
const { performanceMiddleware } = require('../utils/performanceMonitor');

// Add early in middleware stack
app.use(performanceMiddleware());
```

#### Step 2: Add metrics endpoint

In your routes file:

```javascript
const { monitor } = require('./utils/performanceMonitor');

// Metrics endpoint - protected or public depending on your needs
app.get('/api/metrics', (req, res) => {
  res.json(monitor.getMetrics());
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json(monitor.getHealthStatus());
});
```

### Metrics Tracked:
- ✅ Total requests processed
- ✅ Average response time
- ✅ Slow requests (>1 second)
- ✅ Error rate
- ✅ Requests by endpoint
- ✅ Requests by HTTP status
- ✅ CPU usage per request
- ✅ Request size tracking

### Usage:
```bash
# View metrics in real-time
curl http://localhost:4000/api/metrics

# Check health status
curl http://localhost:4000/api/health

# Returns:
{
  "status": "healthy",
  "errorRate": "0.50%",
  "slowRate": "2.15%",
  "avgResponseTime": "45.23ms",
  "totalRequests": 12543
}
```

---

## 5. 🚨 Error Tracking with Sentry

**Status**: Framework created, service setup required

### What was created:
- **File**: `blood-bank-node/configs/sentry.js`
- Error tracking integration
- Performance monitoring hooks
- User context tracking
- Error filtering

### Step-by-Step Setup:

#### Step 1: Create Sentry Account

1. Go to https://sentry.io
2. Sign up (free tier available)
3. Create new project:
   - Platform: Node.js
   - Get your DSN (looks like: `https://key@sentry.io/12345`)

#### Step 2: Install Sentry packages

```bash
cd blood-bank-node
npm install @sentry/node @sentry/tracing
```

If not already in package.json, add to dependencies:
```json
{
  "@sentry/node": "^7.91.0",
  "@sentry/tracing": "^7.91.0"
}
```

#### Step 3: Set environment variables

In `.env.production`:

```env
# Sentry Error Tracking
SENTRY_DSN=https://your-key@sentry.io/your-project-id
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=2.0.0
```

#### Step 4: Integrate into Express app

In `blood-bank-node/server.js`, add at the VERY START:

```javascript
const { initializeSentry, sentryErrorHandler } = require('./configs/sentry');

// Initialize Sentry FIRST - before all other middleware
initializeSentry(app);

// ... rest of middleware setup ...

// Add Sentry error handler at the END - after all routes and other error handlers
sentryErrorHandler(app);
```

#### Step 5: Use in controllers

In any controller, import and use Sentry:

```javascript
const { captureException, setUserContext } = require('../../../configs/sentry');

// In login route
async login() {
  try {
    const user = await Users.findOne({ emailId: data.emailId });
    
    if (user) {
      setUserContext(user._id, user.emailId, user.userName);
    }
    
    // ... rest of logic ...
  } catch (error) {
    captureException(error, {
      userId: currentUser?._id,
      action: 'login',
      emailId: data.emailId
    });
  }
}
```

### Features:
- ✅ Real-time error notifications
- ✅ Error grouping and deduplication
- ✅ Stack trace analysis
- ✅ User identification
- ✅ Performance tracing
- ✅ Release tracking
- ✅ Integration with Slack, email, webhooks

### Pricing:
- **Free tier**: 5,000 errors/month
- **Paid**: $29/month for 50,000 errors

---

## 6. 🔐 Automated Security Scanning

### Option A: Snyk (Dependency Scanning)

#### Setup:

```bash
# Install Snyk CLI
npm install -g snyk

# Authenticate
snyk auth

# Test dependencies
snyk test

# Fix vulnerabilities
snyk fix

# Monitor continuously (CI/CD integration)
snyk monitor
```

#### In CI/CD (GitHub Actions):

```yaml
# .github/workflows/snyk.yml
name: Snyk Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### Option B: OWASP ZAP (API Security Scanning)

#### Setup:

```bash
# Install via Docker
docker pull owasp/zap2docker-stable

# Run security scan against your API
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://your-api.com

# Generate reports
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://your-api.com \
  -J zap-report.json
```

#### OWASP Checks:
- ✅ SQL Injection vulnerabilities
- ✅ XSS (Cross-Site Scripting)
- ✅ CSRF token presence
- ✅ Missing security headers
- ✅ Insecure HTTP methods
- ✅ Authentication bypass attempts

### Option C: GitHub Security

Enable in GitHub repository settings:

1. **Dependabot**: Automatic dependency updates
2. **Secret Scanning**: Detect exposed credentials
3. **Code Scanning**: SAST analysis with CodeQL

### Recommended Scanning Schedule:

```yaml
# Schedule security scans
- Daily: Dependency scanning (Snyk)
- Weekly: OWASP ZAP full scan
- Monthly: Manual security audit
```

---

## 7. 📊 Complete Monitoring Stack Setup

### Recommended Architecture:

```
┌─────────────┐
│  Your API   │
│  (Express)  │
└──────┬──────┘
       │
       ├──→ Logger (Winston)────→ ELK Stack
       │                        (Elasticsearch, Logstash, Kibana)
       │
       ├──→ Metrics────→ Prometheus/Grafana
       │
       ├──→ Errors (Sentry)────→ Sentry Dashboard
       │
       └──→ APM────→ Datadog/New Relic
```

### Option 1: ELK Stack (Logs)

**Setup locally or cloud:**

```bash
# Docker Compose setup
docker-compose -f docker-compose-elk.yml up -d
```

**docker-compose-elk.yml:**

```yaml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.0.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

**Configure Winston for ELK:**

In `blood-bank-node/utils/logger.js`:

```javascript
const elasticsearch = require('winston-elasticsearch');

const esTransport = new elasticsearch.ElasticsearchTransport({
  level: 'info',
  clientOpts: { node: 'http://localhost:9200' },
  index: 'blood-bank-logs'
});

logger.add(esTransport);
```

### Option 2: Prometheus + Grafana (Metrics)

**Docker Compose:**

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    depends_on:
      - prometheus
```

**Setup Prometheus client in Express:**

```javascript
const prometheus = require('prom-client');

// Create metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route, res.statusCode)
      .observe(duration);
  });
  
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
```

### Option 3: Datadog (All-in-one)

**Setup:**

```bash
# Install Datadog agent
npm install dd-trace

# Initialize in server.js (MUST BE FIRST)
const tracer = require('dd-trace').init({
  env: process.env.NODE_ENV,
  service: 'blood-bank-api',
  version: '2.0.0'
});
```

**Set Datadog API key:**

```env
DD_API_KEY=your-datadog-api-key
DD_APP_KEY=your-datadog-app-key
```

**Benefits:**
- ✅ APM (Application Performance Monitoring)
- ✅ Log aggregation
- ✅ Distributed tracing
- ✅ Real-time alerts
- ✅ Custom dashboards

---

## 🚀 Implementation Priority

### Week 1 (After Deployment):
1. ✅ Remove build from git
2. ✅ Set up CSRF protection
3. ✅ Add Swagger documentation
4. 🔧 Enable Sentry error tracking
5. 🔧 Add performance monitoring endpoints

### Week 2:
1. 🔐 Set up Snyk security scanning
2. 📊 Deploy ELK or Prometheus stack
3. 📢 Configure alerts and notifications

### Week 3+:
1. 🔍 Run OWASP ZAP security scans
2. 📈 Add custom Grafana dashboards
3. 🎯 Implement alerting rules
4. 📱 Set up on-call rotations

---

## 📋 Checklist

### CSRF Protection:
- [ ] Middleware created
- [ ] Integrated in Express
- [ ] Token endpoint added
- [ ] React updated to use tokens
- [ ] Tested form submissions

### Swagger/OpenAPI:
- [ ] Configuration created
- [ ] Integrated in Express
- [ ] JSDoc comments added to routes
- [ ] Documentation available at /api/docs
- [ ] Tested endpoint descriptions

### Performance Monitoring:
- [ ] Monitor utility created
- [ ] Integrated in Express
- [ ] Metrics endpoint working
- [ ] Health check endpoint working
- [ ] Slow request logging enabled

### Error Tracking (Sentry):
- [ ] Sentry account created
- [ ] DSN configured in .env
- [ ] Packages installed
- [ ] Integrated in server.js
- [ ] Test error capture
- [ ] Alerts configured

### Security Scanning:
- [ ] Snyk configured
- [ ] CI/CD scanning enabled
- [ ] OWASP ZAP tested
- [ ] Vulnerabilities remediated
- [ ] Scanning scheduled

### Monitoring Stack:
- [ ] ELK or Prometheus deployed
- [ ] Elasticsearch/Prometheus running
- [ ] Kibana/Grafana accessible
- [ ] Winston/Prometheus integrated
- [ ] Dashboards created

---

## 🆘 Common Issues & Solutions

### Issue: CSRF Token validation failing
**Solution**: Ensure cookies are enabled, check SameSite policy, verify token in request headers

### Issue: Sentry not capturing errors
**Solution**: Check DSN configuration, verify NODE_ENV, check Sentry project quota

### Issue: Swagger documentation not showing
**Solution**: Verify route files in `apis` array, check JSDoc syntax, refresh browser cache

### Issue: Performance metrics showing high response times
**Solution**: Check database connection, review slow queries, enable query logging, scale resources

---

## 📞 Support & Resources

- **Sentry Docs**: https://docs.sentry.io/platforms/node/
- **Swagger Docs**: https://swagger.io/tools/swagger-ui/
- **Prometheus Docs**: https://prometheus.io/docs/
- **OWASP ZAP**: https://www.zaproxy.org/docs/
- **Snyk**: https://snyk.io/docs/

---

**Version**: 2.0.0
**Last Updated**: March 30, 2026
**Status**: Ready for Implementation
