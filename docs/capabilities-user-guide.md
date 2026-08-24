# Xnoria — Capabilities & Business Overview

A plain-language guide to how the Xnoria Customer Experience (CX) Intelligence Engine coordinates, protects, and optimizes your customer relationships.

---

## The Big Picture

Xnoria acts as an intelligent coordinator between your customer database, your communication channels, and your customer-facing team. It constantly monitors customer signals—like a new lead requesting contact, an onboarding step getting stuck, or a support ticket going unresolved—and determines the most appropriate follow-up action.

Before any message is sent or any record is changed, Xnoria checks your business rules and asks your team for approval on high-risk tasks. It never sleeps, never forgets context, and keeps a complete, permanent audit log of every decision.

---

## How It Works: The Operational Lifecycle

Instead of running manual tasks, your team interacts with Xnoria in a continuous three-step cycle:

1. **Signal Ingest:** Customer events flow into Xnoria automatically from your CRM, product analytics, or operator inputs (such as contact lists).
2. **AI Coordination:** Xnoria automatically reviews the customer’s journey stage, recalls past interactions, and drafts the best next step (e.g., scoring a lead or drafting an outreach message).
3. **Control & Action:** High-risk actions go directly to your team’s Approval Queue for review. Once approved, Xnoria coordinates with your tools (like sending a WhatsApp message or updating HubSpot) to execute the task.

---

## Team Roles & Access Control

Access to Xnoria is secure and managed through user accounts. Each team member logs in with a secure username and password.

### User Roles & Permissions

| Role              | Business Function                                                                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Administrator** | Full dashboard access and total system control, including creating and managing operator accounts.                                                        |
| **Operator**      | Full operational access: manages approvals, updates the strategy board, monitors health, and runs manual customer diagnostics. Cannot manage other users. |
| **Viewer**        | View-only access to health reports and customer journeys (available as a read-only seat).                                                                 |

For security, active sessions expire automatically after periods of inactivity, requiring the user to log back in. Initial administrator setup and system configurations are locked down to secure deployment credentials managed by your technical administrator.

---

## How Xnoria Receives Information

Xnoria processes information in two primary ways:

### Real-Time Alerts (Instant Messaging)

Team members or connected external systems can send alerts directly to Xnoria using a secure messaging bot (like Telegram). This allows you to log real-time issues, flag customer risks, or trigger immediate escalations.

### Bulk Contact Ingestion (Spreadsheets)

You can process groups of contacts at once by importing standard CSV spreadsheet lists. This is ideal for bulk marketing campaigns or registering new lead cohorts.

- **Supported Fields:** Customer Name, Email Address, Company Name, LinkedIn Profile URL, and Primary Pain Point.
- **Automatic Safeguards:**
  - **Journey Placement:** All newly imported contacts automatically start at the **Acquisition** phase of their customer journey.
  - **Duplicate Prevention:** To protect your reputation and avoid spamming, the system automatically checks your outreach history. If a contact was reached in the last 48 hours, they are automatically skipped.
  - **Intelligent Pauses:** The system inserts a brief pause between processing each contact. This ensures your communication channels (like WhatsApp) do not get blocked for sending messages too quickly.

---

## Decision-Making & AI Coordination

Every time a new alert or signal is received, Xnoria coordinates the response through an automated decision-making cycle:

1. **Recall History:** The system automatically retrieves everything known about the customer, including recent conversation logs and past interaction summaries.
2. **Pinpoint Stage:** It identifies where the customer stands in their lifecycle (e.g., Sales, Onboarding, or Retention) to only consider context-appropriate actions.
3. **Assess Options:** It limits the available actions to only those permitted for that specific stage, saving costs and preventing errors.
4. **Formulate a Plan:** The system analyzes the situation step-by-step and drafts the most appropriate action.
5. **Pass to the Gatekeeper:** The drafted action is sent to the Filter Service for security verification before execution.

### Coordination Safeguards

| Safeguard                 | How it Protects You                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Reasoning Depth Limit** | The system is capped at 5 reasoning steps per alert, preventing infinite loops and ensuring fast response times.                                        |
| **Action Cap**            | A maximum of 3 automated actions can be executed per alert, preventing the system from over-messaging a customer.                                       |
| **Action Chaining**       | Fully supported. If the system creates a new contact in HubSpot, the next step immediately uses that new contact record to send a personalized message. |
| **Conflict Prevention**   | The system is blocked from executing multiple conflicting actions simultaneously.                                                                       |

### Operational Modes

Depending on your business scale and performance requirements, Xnoria can run in two configurations:

- **Unified Assistant Mode (Standard):** A single central coordinator handles all stages of the customer journey. This is efficient and keeps operation costs low.
- **Specialized Assistant Mode (Enterprise):** The system automatically routes events to specialized assistants trained on specific parts of the customer journey (an Acquisition/Sales specialist, a Lifecycle/Support specialist, and a high-severity Escalation specialist).

**AI Model Flexibility:** Xnoria can connect to various enterprise-grade artificial intelligence models depending on your compliance, budget, and performance needs. The system includes automatic fallbacks to alternative models to ensure your service is never interrupted.

---

## Guardrails — When Xnoria Won't Act Again

## Smart Safeguards & Contact Limits

Xnoria applies automatic safeguards to protect your customer relationships, avoiding over-contacting customers or executing conflicting tasks:

| Safeguard                  | Journey Phase                 | How it Protects the Customer Experience                                                                                                                                                         |
| -------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Follow-Up Cooldown**     | Onboarding & Product Adoption | If an automated nudge was sent to a customer in the last 48 hours, the system blocks further automated nudges. Instead, it alerts your team to offer a personalized support check-in.           |
| **Outreach Deduplication** | Campaign Ingestion            | Any lead who received an outreach message in the last 48 hours is skipped during list uploads, preventing double-messaging.                                                                     |
| **Severity Escalation**    | Onboarding & Retention        | Low-severity issues trigger automated help messages, while high-severity risks (like blocked accounts or severe churn risks) are immediately routed to your team for white-glove manual review. |
| **Compliance Safeguards**  | Marketing & Communications    | Actions involving public messaging or social media are flagged as sensitive, instructing the AI to run validation checks and always require human approval before publishing.                   |

These safeguards are embedded directly into the system's operational logic, providing a clear explanation in the dashboard logs if an action was skipped (e.g., "Skipped: contact recently messaged").

---

## The Action Filter & Audit Logging

To ensure security and brand safety, Xnoria routes every automated decision through a protection layer called the **Action Filter**. No customer profile is updated and no communication is sent without clearing these validation gates:

- **Strategy Alignment:** The system verifies if the drafted action is currently registered and enabled on your active strategy board.
- **Approval Check:** It checks if the action involves sensitive resources and flags it for team review when required.
- **Permanent Audit Log:** Every decision—whether it is executed, blocked, or sent for human approval—is written to an immutable history file. This includes the date, action details, and the name of the team member who authorized it.

### Why an Action Might Be Blocked

If Xnoria blocks an automated action, the dashboard will display a clear status message:

| Dashboard Alert             | What it Means                                                                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unregistered Strategy**   | The system tried to run an action that is not part of your active business plan.                                                                   |
| **Incorrect Journey Stage** | The action does not match where the customer currently stands in their lifecycle (e.g., trying to send a retention offer to a brand new prospect). |
| **Disabled Strategy**       | The action is part of the plan but has been temporarily turned off by your administrator.                                                          |
| **Rejected by Team**        | A team member reviewed the action request and decided to reject it.                                                                                |
| **Service Offline**         | A communication channel (like WhatsApp or email) or external tool could not be reached at that moment.                                             |

---

## Business Actions Xnoria Can Coordinate

Xnoria coordinates 26 distinct actions across the customer lifecycle. High-risk actions marked **Requires Approval** are automatically paused until reviewed by a team member.

### Acquisition Phase

- **Instant WhatsApp Engagement:** Sends an immediate WhatsApp acknowledgment to a new inbound lead. (Automated)
- **AI Out-of-Hours Nurture:** Starts an AI-driven text conversation to qualify leads arriving outside business hours. (Automated)
- **Automatic Lead Scoring:** Scores and tags new leads in your CRM based on their profile data. (Automated)
- **Retrieve Customer Profile:** Gathers recent customer details and contact records from HubSpot. (Automated)
- **Update/Create Profile:** Creates a new customer record or updates an existing one in HubSpot. (Automated)
- **Personalized Cold Outreach:** Sends custom email or message campaigns to qualified prospects. (**Requires Approval**)

### Sales Phase

- **Enroll in Sequence:** Automatically places a contact into an outbound email/task sequence. (Automated)
- **Prioritize Account:** Flags high-value accounts for immediate sales representative call-backs. (**Requires Approval**)
- **Send Sales Message:** Sends a personalized follow-up message to an active sales lead. (Automated)

### Onboarding Phase

- **Request Onboarding Documents:** Initiates document collection requests for new accounts. (Automated)
- **Validate Uploads:** Checks submitted files and marks them complete in your CRM. (Automated)
- **Progress Nudge:** Sends automatic reminders to customers who stall mid-onboarding. (Automated)
- **White-Glove Support Assist:** Offers direct CSM assistance to clients experiencing onboarding difficulties. (**Requires Approval**)
- **Escalate Blocker:** Automatically flags and moves onboarding support tickets to a priority queue. (Automated)

### Product Adoption Phase

- **Low Engagement Alert:** Sends educational messages to accounts showing low product usage. (Automated)
- **Feature Education Nudge:** Sends targeted feature guides to users trying inefficient workarounds. (Automated)
- **Workaround Education:** Explains primary features to users who are using secondary methods. (Automated)
- **Log Feedback to CRM:** Captures and logs product feature requests directly into HubSpot pipelines. (Automated)

### Support Phase

- **Escalate Ticket:** Elevates unresolved support requests directly to senior technicians. (Automated)
- **Resolution Status Update:** Sends custom notifications to users when their issues are resolved. (**Requires Approval**)

### Marketing & Commercial Phase

- **Schedule Social Posting:** Schedules or publishes promotional contents to your social media pages. (**Requires Approval**)
- **Re-engage Accounts:** Sends re-engagement notes to accounts showing signs of disinterest. (Automated)
- **Feedback Collection Follow-Up:** Follows up on feedback requests that have not been answered. (Automated)

### Retention Phase

- **Churn Win-Back Campaign:** Enrolls disengaged accounts in customer win-back marketing plans. (**Requires Approval**)
- **Flag Account for Review:** Alerts account managers to perform immediate reviews of high-risk accounts. (Automated)

### Expansion Phase

- **Upgrade Notification:** Informs expansion-ready clients about premium features or tier upgrades. (Automated)

_(Note: Additional system actions, like account expansion alerts, can be added or disabled directly from the Strategy Board by your administrator.)_

---

## Team Approvals & Human Verification

For sensitive customer-facing actions that require human oversight (such as prioritizing a customer alert or initiating a win-back sequence):

1. **Action Paused:** The system automatically pauses the action and flags it as pending.
2. **Notification Alert:** A notification is sent directly to your team’s chat channel (such as Telegram) with details of the proposed action and a link to review it.
3. **Dashboard Review:** The operator opens the **Approvals** page on their dashboard.
4. **Verification & Edit:** The operator inspects the proposed message or profile update, edits the text or details if needed, and clicks **Approve** or **Reject**.
5. **Execution & Audit:** Approved actions are immediately processed through your connected tools (like HubSpot or WhatsApp). Rejected actions are canceled. The reviewer's username and decision are permanently logged in the audit history for complete accountability.

---

## Customer History & System Memory

To provide continuous and contextual assistance, Xnoria remembers details about every customer interaction through three tiers of memory:

- **Recent Conversation Log:** Stores the exact sequence of recent text turns and replies to maintain active chat context.
- **Relationship History:** Retains a summary of all past interactions, diagnostic findings, and interventions. This gives the coordinator a multi-month view of customer trends.
- **Diagnostic Context:** Stores previous customer health metrics and recommended solutions, ensuring future plans are consistent with past results.

Memory is automatically retrieved before any action is drafted.

> ⚠️ **Data Backup Warning:** While relationship history and conversation logs are permanently saved in your system's database, operational summaries (like active system diagnostics) are kept in short-term data volumes. To ensure zero data loss during server migrations or system resets, your system administrator should run regular automated backups of the database.

---

## On-Demand Customer Diagnostics

Operators can trigger a comprehensive customer experience checkup on any customer at any time from the dashboard:

1. **Identify the Customer:** Search for a customer by email address or select one from the live customer feed.
2. **Run Diagnostic Check:** Xnoria gathers and analyzes all historical records—including CRM fields, past messages, previous action plans, and active product usage details (when product tracking is active)—to assess the account's health. No messages are sent and no records are modified during this check.
3. **Review Health Ratings:** View stage-by-stage customer experience health ratings, critical alerts, and key findings.
4. **Generate Action Plan:** Generate a prioritized plan containing up to 5 recommended actions. The system automatically filters out any actions that are currently disabled in your business settings.
5. **Execute Actions:** Team members can review and execute plan recommendations with a single click. Every execution goes through the standard Strategy and Team Approval gates.
6. **Export Report:** Download the entire diagnostic analysis and action plan as a formatted PDF report.

Completed diagnostics are automatically added to the customer’s profile history, allowing future automated workflows to reference past findings.

- **Product Tracking Note:** Customer product usage details (such as features used or activity logs) are only visible if your product has enabled user tracking. If user tracking is not set up, Xnoria will gracefully run diagnostics using CRM and interaction history only.

---

## The Operator Dashboard

The Dashboard serves as the secure command center for your operations and customer success teams. It is a **read-and-control** interface: team members can review system metrics and approve actions, but all final operations (such as sending messages or modifying contact records) are executed through your connected tools (like HubSpot and WhatsApp), never directly by the dashboard itself.

### Navigation & Workspace

The dashboard is organized into two primary work areas:

#### Customer Experience (CX) Diagnostic Tools

- **Compass:** An interactive wheel visualization showing stage-by-stage customer health, allowing you to explore the root causes of issues.
- **Radar:** A portal to run manual customer health checks and view active customer signals.
- **Journey Map:** A timeline showing touchpoints and friction points across the customer lifecycle.
- **Model Editor:** A workspace to customize domains, signals, and recommended customer solutions.

#### System Operations

- **Health Center:** Real-time metrics and health charts for each phase of the customer journey.
- **Approval Queue:** A live dashboard showing pending customer communications that require manual team authorization before sending.
- **Strategy Board:** A control panel to view all registered actions, toggle them on/off, or change approval requirements.
- **Customer Memory Search:** Search past customer observations and relationship logs by customer email or ID.
- **Live Activity Feed:** A real-time log of recent automated decisions, checks, and approvals.
- **Reasoning Sessions:** View recent automated decisions, showing the customer name, journey stage, and final outcome.
- **System Status Monitor:** Live status metrics showing your servers, system health, and storage utilization.

### Design & Theme

The dashboard is built dark-first for reduced eye strain, and fully supports switching between light and dark modes according to browser preferences.

### Complete Bilingual Support

The system is localized in English and Spanish, set during installation for the entire workspace. This localization covers:

- All dashboard pages, buttons, labels, and exported PDF reports.
- System alerts and notification templates sent to your team.
- Customer-facing message templates sent via WhatsApp or email.

Each system instance is configured for a single, uniform language to keep communication consistent across your operations.

---

## Customer Experience Diagnostic Suite

Xnoria includes four visual tools to help your team analyze and customize customer experience strategies.

### Compass (Health Wheel)

An interactive visual map that tracks customer experience health across the customer lifecycle, helping you isolate root causes of customer friction.

- **Lifecycle Exploration:** Click and rotate the wheel to drill down into specific journey phases (from initial acquisition to account expansion).
- **Alert Detail Panel:** Select any active issue to view a plain-language explanation, a severity rating, and recommended solutions.
- **Root Cause Search:** Search for issues by keyword or view them grouped by root cause (e.g., showing all clarity issues or product friction points across the entire lifecycle at once).
- **The Diagnostic Framework:** Backed by 8 lifecycle phases, 94 customer health signals, 10 root cause categories (such as Trust, Friction, and Responsiveness), and 138 recommended solutions in English and Spanish.

### Radar (Health Feed & Diagnostics)

A real-time workspace containing a signal browser, active signal charts, and the diagnostics panel.

- **Active Signals Feed:** See customer signals in real time as they arrive in your system.
- **Radar Health Map:** A spider-chart visualization showing the density of active signals, highlighting which lifecycle stages have the highest concentration of friction.
- **Signal Browser:** Browse the entire library of 94 customer health signals, filtering by journey stage or root cause.
- **Diagnostics Panel:** Access the manual customer diagnostics and action planning workflow described in Section 10.

### Journey Map (Touchpoint Map)

A visual timeline of the customer journey, mapping touchpoints and team ownership.

- **Timeline Exploration:** Review the chronological journey timeline from acquisition to expansion.
- **Operational Branches:** View variations in the timeline based on customer type, active channel, or team ownership.
- **Friction Identification:** Click touchpoints to see associated signals, ownership team, and severity.
- **Layer Filters:** Filter the timeline view by communication channel, active team, customer emotion, or risk level.

### Strategy Editor (Model Customizer)

A full editor that allows your team to modify and customize the entire customer experience diagnostic model.

- **Journey Setup:** Rename or modify journey phases and root cause structures to match your business model.
- **Signal Management:** Define new customer health signals, set severity ratings, and attach indicators.
- **Solution Authoring:** Author and translate (English/Spanish) action recommendations to link to signals.
- _All adjustments made here immediately update the Compass, Radar, and Journey Map displays._

---

## Connected Platforms & Integrations

Xnoria connects directly with your existing business systems and communication channels to coordinate actions seamlessly:

| Platform                   | Business Integration & Usage                                                                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HubSpot CRM**            | Automatically look up, create, or update customer profiles; apply CRM tags; log feedback requests directly to your product team's pipeline.                 |
| **WhatsApp**               | Send outbound customer communications, including welcome messages, automated reminders, cold outreach, and resolution updates.                              |
| **Telegram**               | Exposes a secure operator channel to receive incoming customer alerts and review pending team approvals.                                                    |
| **Automation Engine**      | Connects to your back-end automation workflows to trigger complex tasks and data updates.                                                                   |
| **Product Analytics**      | Retrieves user activity metrics to inform health checks. _(Note: Requires user activity tracking to be enabled in your software to populate usage charts.)_ |
| **Google Sheets**          | Coordinates content calendars and editorial workflows for public marketing campaigns.                                                                       |
| **Threads**                | Automatically schedules and publishes approved promotional content to your social profiles.                                                                 |
| **Enterprise AI Services** | Generates semantic models to retrieve past context and history for the coordinator.                                                                         |

---

## Complete Audit Trails

To maintain transparency, Xnoria keeps a permanent, immutable record of all activities. System records are never deleted and cover:

| Operational Log          | What it Records                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Action History**       | Every single action attempted by the system, including what action was drafted, its execution status, full payload, reviewer name (if approved), and timestamp. |
| **Decision Logs**        | Detailed histories of each automated decision session, including customer ID, lifecycle stage, AI configuration used, and the session outcome.                  |
| **Conversation History** | Complete text transcripts of recent conversations per contact.                                                                                                  |
| **Memory Indexes**       | Conceptual indexes used to retrieve relevant relationship history.                                                                                              |
| **Diagnostic History**   | Results, findings, and metrics of every manual customer checkup run by operators.                                                                               |
| **Action Plans**         | Recommended plans of action, including priority rankings, and whether items were executed.                                                                      |

---

## Multi-Brand & Client Isolation

Xnoria can host multiple isolated customer instances on a single server, making it perfect for managing multiple brands or client portals:

- **Data Isolation:** Each brand or account receives its own isolated database and storage containers.
- **Memory Safety:** Customer memory records are partitioned, ensuring no cross-brand leakage or memory conflicts occur.
- **Dedicated Dashboards:** Each instance operates with independent login interfaces, configurations, and communication settings.

---

## Deployment & Backup Options

Xnoria offers flexible hosting arrangements depending on your server infrastructure and compliance needs:

- **Development Sandbox:** Runs locally on a development machine for quick testing.
- **Cloud Production:** Deploys to a secure cloud server with automatic SSL/TLS encryption for public access.
- **On-Premises Server:** Deploys to local edge hardware (like office server units) for private local area network access.

**Data Protection:** The system includes encrypted backup and restore utilities to securely archive operational logs and databases.

---

## What Xnoria Does NOT Do (Security Limits)

To protect your business and keep control in your hands, Xnoria operates under strict security boundaries:

- **Never contacts customers directly from the AI reasoning layer:** No messages are sent and no records are modified without passing through the security filter gate first.
- **Never makes unilateral decisions on high-risk tasks:** Sensitive campaigns (such as cold outreach or win-back sequences) always pause and wait for your team's manual review.
- **Never changes business rules on its own:** Only an operator with dashboard access can enable, disable, or adjust approval requirements for actions on the Strategy Board.
- **Never stores customer PII outside HubSpot:** Customer contact details remain in HubSpot; Xnoria only indexes contact IDs and interaction summaries for memory lookup.
- **Never exposes public endpoints for external events:** Alerts and signals enter the system exclusively through your secure operator channel or approved spreadsheet imports.
- **Never guarantees memory retention during database overrides:** Active checkups and operational summaries reside in short-term memory volumes. Wiping system data overrides these unless a database backup is restored.
