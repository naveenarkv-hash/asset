# AssetQ product scope

The attached `Project_X.docx` is product reference material. Its consulting-first sequencing and procurement architecture do not override the user's request to build a SaaS application and remove purchase management.

## Product decisions

- Product name: AssetQ.
- Experience: organization registration → master setup → users/roles → assets → workflow review → go live.
- Green-and-white responsive React application with a Python modular API and persistent SQLite development database.
- One tenant per workspace; authenticated requests derive tenant identity from the session, never from a submitted tenant ID.
- Defaults reduce initial setup; no fake customer assets or default credentials.
- AI assistance is optional and human-reviewed. Local heuristics identify themselves. No disposal authorization, final approvals, or write-offs are automated.
- Purchase management is excluded. Vendor/AMC records and asset valuation are retained for maintenance and finance needs.

## Blueprint mapping

| Document area        | Delivered in the initial application                                                                                      | Retained for later implementation                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Identity/access      | Workspace registration/sign-in; RBAC; custom roles; passwords/sessions; blocked accounts                                  | MFA, SSO, session dashboard, secure invitation/reset delivery, delegation                                |
| Organization masters | Locations with parent codes; departments and cost centers; workspace currency/time zone                                   | Multi-entity hierarchy, complex approval hierarchy                                                       |
| Asset lifecycle      | IT/non-IT register; ownership; warranty; transfer/retirement/disposal approvals; verification; CSV; lifecycle enforcement | Attachments, printed QR/barcode packs, discovery agents, movement handover checklists, bulk actions      |
| Helpdesk             | Incidents/requests/work orders; priority/category/group; asset history; comments; SLA due dates; repair synchronization   | Full ITIL problem/change modules, SLA pause/business calendars, time tracking, agent analytics           |
| Maintenance          | Scheduled work orders; checklist completion; next service; due-date automation                                            | Usage/telemetry triggers, readings, parts inventory, image evidence                                      |
| Vendor/AMC           | Service/OEM vendor and contract masters                                                                                   | Vendor escalation adapters, contract SLA enforcement                                                     |
| Finance              | SLM/WDV estimated book values; depreciation and tax masters; cost centers                                                 | Finance postings, ERP sync, formal financial write-offs, accounting approvals                            |
| Visual intelligence  | Upload image; place location assets; status colors; detail click-through                                                  | Building-scale hierarchy explorer, heatmaps/telemetry, large-file object storage                         |
| Automation           | 11 built-in triggers; scheduler; configurable thresholds/toggles; deduplicated runs; in-app messages/audit                | General condition/action rule builder, broker/outbox, channels, retries/webhooks                         |
| AI assistance        | Local category/priority suggestions; visible-ticket keyword duplicates; KB retrieval; optional HTTPS model advice         | Embeddings/vector search, ML classifiers, confidence evaluation, feedback/label store, predictive models |
| Audit/reporting      | Server action history; physical verification stamp; asset/audit CSV; interactive dashboard; valuation summaries           | Audit packs, tamper-evident external log store, regulatory reports, tenant-specific analytics            |
| SaaS packaging       | Tenant-scoped workspaces and edition metadata                                                                             | Payment provider, metering, enforced subscriptions, commercial tenant provisioning                       |
| Purchase management  | Explicitly excluded                                                                                                       | PR/PO/GRN/AP and procurement-driven asset creation remain out of scope                                   |

## Automation controls

Sensitive transitions use a dedicated request and review API. Self-approval, stale transitions, repeat review, and ordinary-edit bypasses are rejected. Completion requires maintenance findings and all checklist steps. System fields such as requesters, SLA clocks, timestamps, and identifiers cannot be changed through generic edits.

Alerts for warranty dates, SLA windows, and recurring incidents have editable thresholds. Notifications and maintenance creation are deduplicated. Rules run every minute in the API process and can also be manually scanned. Notifications are persisted; no external message is claimed as delivered.

## Tested boundaries

The automated API suite checks workspace isolation, password/session access, employee visibility, private ticket-assistance scope, immutable codes, tenant-scoped references, protected fields, cross-user approvals, governed-state enforcement, automation deduplication, rule thresholds, maintenance recurrence/checklists, repair lifecycle synchronization, CSV rollback, blocked-session revocation, password rotation, and onboarding prerequisites. Browser tests exercise the first-customer journey and responsive rendering.
