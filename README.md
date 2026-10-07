# AssetQ

A green-and-white SaaS application for connected asset management, IT helpdesk, maintenance, and governance. Built from `Project_X.docx`, with purchase management excluded as requested.

## Run

For Windows, see [Windows setup](WINDOWS_SETUP.md) or double-click `START_ASSETQ.bat` after extracting the project. `/workspace/asset` below is the cloud path; use your local extracted folder on your own computer.

Requires Node.js 22.12+ and Python 3.12+. No Python packages or external database service are needed for this development version.

```sh
cd /workspace/asset
npm ci --cache /workspace/.npm-cache
npm run dev
```

The development command starts the Python API on port 8000 and Vite on port 5173. It reuses an already-running API. Data persists in `.data/assetq.sqlite3`; keep this directory private and backed up. No default login, secret, or demo workspace is installed.

For a single-server build:

```sh
npm run build
npm start
```

The Python server then serves both the built application and the API on port 8000. Terminate the development API before starting another API on that port.

## First customer journey

1. Register an organization, workspace ID, and administrator account.
2. Add organization locations and departments in **Master data**.
3. Create team accounts in **People & teams** and assign a default or custom role. Share initial passwords through your organization's secure channel. Users can change their own password from the profile menu.
4. Add asset categories/models as needed. Register assets individually or use the CSV importer. Imports validate the complete batch and roll back if any row is invalid.
5. Review default permissions, 24/7 SLA policies, and automation rules. Check the review box in the setup guide.
6. Choose **Go live**. This activates the workspace state; it is not a public deployment or a commercial-production certification.

Existing users sign in with workspace ID, work email, and password. Workspaces start with roles, SLA policies, asset categories, knowledge articles, service definitions, depreciation defaults, and enabled rules. Customer assets and additional users start empty.

## Included

- Persistent, tenant-scoped records and separate workspace authentication.
- Password hashing (PBKDF2), expiring HttpOnly sessions, sign-out, password rotation, blocked-user revocation, same-origin write checks, and basic authentication throttling.
- Default roles and custom module permissions, enforced by the server. Employees see their own assets and tickets and can raise tickets and reply.
- IT and non-IT asset register: tagging, classification, owners, locations, serials, warranty, cost centers, valuation, lifecycle transitions, verification, export, and transactional CSV import.
- Governed transfer, retirement, and disposal requests. A different authorized user must approve. Governed transitions cannot be applied through ordinary record edits.
- Helpdesk: incidents, requests, work orders, priorities, asset linkage, routing groups, SLA deadlines, conversation, status updates, knowledge retrieval, duplicate suggestions, and optional model-generated assistance.
- Ticket start/resolution synchronizes linked asset repair state where the lifecycle permits it.
- Maintenance work orders, checklists, completion findings, recurring service dates, and overdue work-order creation.
- Master data: location hierarchy, departments/cost centers, categories, models, vendors, warranty/AMC contracts, services, SLA policies, depreciation classes, taxes, and maintenance checklists. Codes stay immutable; archive instead of delete.
- Asset-finance estimates using straight-line or declining-balance depreciation, useful life, residual value, and activation date.
- Floor-plan image upload, asset placement, status colors, and asset-detail click-through.
- Clickable dashboard metrics, operational lists, in-app notifications, and audit history.
- Eleven built-in automation rules, enable/disable controls, adjustable warranty/SLA/recurrence thresholds, and a minute-based scheduler. Reminder/work-order creation is deduplicated.
- Responsive desktop and mobile layouts with bundled fonts.

No purchase requests, purchase orders, goods receipts, procurement item catalog, accounts-payable invoice workflows, or purchase-triggered asset creation are included. Vendors/contracts remain for asset warranty and service operations. Finance estimates remain; no accounting ledger entries are posted.

## AI

Local assistance uses transparent keyword classification and retrieval, not a trained ML model. It suggests ticket category, priority, routing group, similar visible tickets, and relevant knowledge articles. Suggestions require human review.

Set `ASSETQ_AI_KEY` securely in the server environment to enable generated troubleshooting advice through an OpenAI-compatible HTTPS endpoint. Optional settings:

- `ASSETQ_AI_URL`: defaults to `https://api.openai.com/v1/chat/completions`.
- `ASSETQ_AI_MODEL`: defaults to `gpt-4o-mini`.

The browser never receives the key. Ticket text is sent only when a user requests assistance. Do not put credentials in tracked files. Configure provider access and your customer data policy before enabling this integration. Model-generated advice has not been validated against a live provider in this workspace because no provider binding was supplied.

## Validation

```sh
npm test
npm run build
npm run test:e2e
```

API tests use an isolated temporary SQLite database. Browser tests start isolated services on ports 8001 and 5174 with `.data/e2e.sqlite3`. A system Chromium is expected at `/usr/bin/chromium`; set `ASSETQ_CHROMIUM` to another executable if necessary. Browser tests create uniquely named test workspaces and check registration, master setup, user creation, asset registration, go-live, assisted tickets, replies, import, automation configuration, floor-plan placement, and mobile overflow. Screenshots and traces go to ignored `test-results/`.

## Deployment settings and remaining delivery

`ASSETQ_DB` changes the database path; `PORT` changes the API/server port. `ASSETQ_API_PORT` configures the development proxy. `ASSETQ_WEB_PORT` changes the development UI port. `ASSETQ_ALLOWED_ORIGINS` is a comma-separated exact origin list for a deliberately separate UI origin. `ASSETQ_SECURE_COOKIE=1` enables Secure cookies behind HTTPS.

This is a working initial application, not the entire enterprise roadmap in the document. Before a public commercial rollout, implement and validate managed HTTPS hosting, PostgreSQL migration and database-enforced tenant isolation, scalable workers, backups/restore, monitoring, hardened application serving, independent security review, and load testing. Current SQLite/standard-library serving is for development or a controlled pilot; the document's 1,000-user, uptime, encryption-at-rest, and compliance targets have not been demonstrated.

Keep the remaining document scope on the delivery roadmap: SSO/MFA, secure invitation/reset email flows, external email/SMS/WhatsApp/voice adapters, delivery retries, signed webhooks, ERP/GL integration, subscription billing and enforced plan limits, bulk editing, asset/document evidence storage, delegated approvals, working-hours calendars and SLA pauses, telemetry/usage-based maintenance, problem/change management, AI feedback/model evaluation, predictive maintenance, audit packs, mobile apps, and disaster-recovery validation. Current notification delivery is in-app; the UI identifies unconnected integrations.

See [product scope](docs/PRODUCT_SCOPE.md) for the source-document mapping.
