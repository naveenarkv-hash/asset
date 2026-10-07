import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  Boxes,
  Ticket,
  Wrench,
  Workflow,
  Users,
  ShieldCheck,
  Database,
  Map,
  BookOpen,
  Bell,
  Search,
  Plus,
  ArrowUpRight,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  SlidersHorizontal,
  Download,
  Sparkles,
  CircleHelp,
  LogOut,
  Settings,
  CheckCircle2,
  Clock,
  Building2,
  Leaf,
  Activity,
  FileCheck,
  Wallet,
  MoreHorizontal,
  Zap,
  Mail,
  Menu,
  RefreshCw,
  Loader2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "./styles.css";
const icons = {
  overview: LayoutDashboard,
  assets: Boxes,
  tickets: Ticket,
  maintenance: Wrench,
  automation: Workflow,
  users: Users,
  roles: ShieldCheck,
  masters: Database,
  layouts: Map,
  knowledge: BookOpen,
  approvals: FileCheck,
  finance: Wallet,
  audit: Activity,
  settings: Settings,
};
const labels = {
  overview: "Overview",
  assets: "Asset register",
  tickets: "Helpdesk",
  maintenance: "Maintenance",
  layouts: "Visual workspace",
  knowledge: "Knowledge base",
  finance: "Asset finance",
  approvals: "Approvals",
  automation: "Automation",
  masters: "Master data",
  users: "People & teams",
  roles: "Roles & permissions",
  audit: "Audit trail",
  settings: "Workspace settings",
};
const api = async (path, method = "GET", body) => {
  const r = await fetch("/api" + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json();
  if (!r.ok) throw Error(d.error || "Request failed");
  return d;
};
const pretty = (s) =>
  String(s || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (x) => x.toUpperCase());
const date = (s) =>
  s
    ? new Date(s).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
function Badge({ value }) {
  return (
    <span
      className={
        "badge " +
        ([
          "ACTIVE",
          "ASSIGNED",
          "RESOLVED",
          "COMPLETED",
          "APPROVED",
          "IN_STOCK",
          "ENABLED",
        ].includes(value)
          ? "green"
          : ["P1", "IN_REPAIR", "REJECTED", "BLOCKED", "BREACHED"].includes(
                value,
              )
            ? "red"
            : [
                  "DRAFT",
                  "PENDING",
                  "P2",
                  "MAINTENANCE",
                  "SCHEDULED",
                  "NEW",
                ].includes(value)
              ? "amber"
              : "neutral")
      }
    >
      {pretty(value)}
    </span>
  );
}
function Button({ children, secondary = false, small = false, ...props }) {
  return (
    <button
      className={`${secondary ? "btn-secondary" : "btn-primary"} ${small ? "small" : ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
function Empty({
  icon: Icon = Boxes,
  title = "Nothing here yet",
  text = "Add your first record to get started.",
  action,
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon size={26} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
function Auth({ onAuth }) {
  const [register, setRegister] = useState(true),
    [form, setForm] = useState({
      organization: "",
      workspace: "",
      name: "",
      email: "",
      password: "",
    }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      onAuth(await api(register ? "/register" : "/login", "POST", form));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth">
      <div className="auth-story">
        <Logo />
        <div className="auth-copy">
          <span className="eyebrow">ONE WORKSPACE. EVERY ASSET.</span>
          <h1>
            Your assets.
            <br />
            Your people.
            <br />
            <span>All connected.</span>
          </h1>
          <p>
            From the first asset to the next big decision. Bring asset
            management, support, and maintenance together.
          </p>
          <div className="auth-features">
            {[
              [Boxes, "A complete asset lifecycle"],
              [Workflow, "Less busywork. More automation."],
              [ShieldCheck, "Your workspace, your permissions"],
            ].map(([I, t]) => (
              <div key={t}>
                <I size={20} />
                {t}
              </div>
            ))}
          </div>
        </div>
        <div className="auth-foot">
          <Leaf size={16} /> Built for a smarter, more sustainable workplace.
        </div>
        <div className="orb one" />
        <div className="orb two" />
      </div>
      <div className="auth-form">
        <div className="auth-top">
          {register ? "Already have a workspace?" : "New to AssetQ?"}{" "}
          <button
            onClick={() => {
              setRegister(!register);
              setError("");
            }}
          >
            {register ? "Sign in" : "Create workspace"}{" "}
            <ArrowUpRight size={14} />
          </button>
        </div>
        <form onSubmit={submit}>
          <span className="eyebrow">LET’S GET YOU SET UP</span>
          <h2>
            {register ? "A fresh start for your assets." : "Welcome back."}
          </h2>
          <p>
            {register
              ? "Create your workspace. Add your team. Make it yours."
              : "Sign in to your organization’s workspace."}
          </p>
          {register && (
            <>
              <Field
                label="Organization name"
                required
                value={form.organization}
                onChange={(v) =>
                  setForm({
                    ...form,
                    organization: v,
                    workspace: v
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, ""),
                  })
                }
                placeholder="e.g. Acme Industries"
              />
              <Field
                label="Your full name"
                required
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                placeholder="e.g. Alex Morgan"
              />
            </>
          )}
          <Field
            label="Workspace ID"
            required
            value={form.workspace}
            onChange={(v) => setForm({ ...form, workspace: v })}
            placeholder="acme-industries"
            hint="Your team uses this ID to sign in."
          />
          <Field
            label="Work email"
            type="email"
            required
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
            placeholder="you@company.com"
          />
          <Field
            label="Password"
            type="password"
            required
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
            placeholder={register ? "At least 10 characters" : "Your password"}
          />
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <Button disabled={busy}>
            {busy ? <Loader2 className="spin" size={18} /> : null}
            {register ? "Create my workspace" : "Sign in"}{" "}
            <ArrowRight size={17} />
          </Button>
          <div className="auth-note">
            <ShieldCheck size={16} /> Secure workspace. No credit card required.
          </div>
        </form>
      </div>
    </div>
  );
}
function Logo() {
  return (
    <div className="logo">
      <span className="logo-mark">
        <Boxes size={23} strokeWidth={2} />
      </span>
      Asset<span className="logo-q">Q</span>
      <span className="logo-dot" />
    </div>
  );
}
function Field({
  label,
  hint,
  options,
  type = "text",
  value,
  onChange,
  ...props
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {options ? (
        <select
          aria-label={label}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          {...props}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {options.map((o) => (
            <option
              key={typeof o === "string" ? o : o.value}
              value={typeof o === "string" ? o : o.value}
            >
              {typeof o === "string" ? pretty(o) : o.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          aria-label={label}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          {...props}
        />
      ) : (
        <input
          aria-label={label}
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          {...props}
        />
      )}{" "}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function Modal({ title, subtitle, children, onClose, wide = false }) {
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={"modal " + (wide ? "wide" : "")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-heading">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-btn" aria-label="Close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
function App() {
  const [data, setData] = useState(null),
    [loading, setLoading] = useState(true),
    [page, setPage] = useState("overview"),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(""),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("ALL"),
    [master, setMaster] = useState("locations"),
    [mobile, setMobile] = useState(false),
    [notifications, setNotifications] = useState(false),
    [onboard, setOnboard] = useState(false);
  useEffect(() => {
    api("/data")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const reload = async () => setData(await api("/data"));
  const run = async (fn, msg) => {
    try {
      const r = await fn();
      await reload();
      if (msg) setToast(msg);
      return r;
    } catch (e) {
      setToast(e.message);
      throw e;
    }
  };
  const nav = (p) => {
    if (
      data &&
      !["overview", "assets", "tickets", "knowledge"].includes(p) &&
      !data.me.permissions.includes(p === "layouts" ? "assets" : p)
    ) {
      setToast("Your role does not have access to this module");
      return;
    }
    setPage(p);
    setSearch("");
    setFilter("ALL");
    setMobile(false);
  };
  const openCreate = (k) => setModal({ type: "create", kind: k });
  if (loading)
    return (
      <div className="loading">
        <Logo />
        <Loader2 className="spin" />
      </div>
    );
  if (!data)
    return (
      <Auth
        onAuth={(d) => {
          setData(d);
          setPage("overview");
          setSearch("");
          setFilter("ALL");
          setNotifications(false);
          setOnboard(
            !d.tenant.settings.live && d.me.permissions.includes("settings"),
          );
        }}
      />
    );
  const can = (p) => data.me.permissions.includes(p),
    currency = (v) =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: data.tenant.settings.currency || "USD",
        maximumFractionDigits: 0,
      }).format(Number(v) || 0);
  const list = (k) =>
    (data[k] || []).filter(
      (r) =>
        (filter === "ALL" ||
          (filter === "OPEN" && !["RESOLVED", "CLOSED"].includes(r.status)) ||
          (filter === "OUTSTANDING" && r.status !== "COMPLETED") ||
          (filter === "WITHIN_SLA" && slaCompliant(r)) ||
          r.status === filter ||
          r.priority === filter) &&
        Object.values(r).some(
          (v) =>
            typeof v === "string" &&
            v.toLowerCase().includes(search.toLowerCase()),
        ),
    );
  const steps = [
    {
      title: "Set up your organization",
      text: "Locations, departments, and cost centers.",
      done: data.locations.length > 0 && data.departments.length > 0,
      page: "masters",
    },
    {
      title: "Bring your team on board",
      text: "Create user accounts and assign roles.",
      done: data.users.length >= 2,
      page: "users",
    },
    {
      title: "Register your first assets",
      text: "Add categories, owners, and warranty dates.",
      done: data.assets.length > 0,
      page: "assets",
    },
    {
      title: "Review your workflow",
      text: "Check SLA policies and automation rules.",
      done: data.tenant.settings.reviewed || false,
      page: "automation",
    },
  ];
  const done = steps.filter((s) => s.done).length;
  const live = data.tenant.settings.live;
  const addFor = Object.fromEntries(
    Object.entries({
      assets: "assets",
      tickets: "tickets",
      maintenance: "maintenance",
      users: "users",
      roles: "roles",
      knowledge: "knowledge",
      masters: master,
      layouts: "layouts",
    }).filter(
      ([p]) =>
        p === "tickets" ||
        can(p === "knowledge" ? "tickets" : p === "layouts" ? "assets" : p),
    ),
  );
  const accessible = (p) =>
    p === "overview" ||
    p === "knowledge" ||
    p === "tickets" ||
    p === "assets" ||
    (p === "layouts" ? can("assets") : can(p));
  const activeAssets = data.assets.filter(
    (a) => !["RETIRED", "DISPOSED", "ARCHIVED"].includes(a.status),
  );
  const openTickets = data.tickets.filter(
    (t) => !["CLOSED", "RESOLVED"].includes(t.status),
  );
  const dueWork = data.maintenance.filter((w) => w.status !== "COMPLETED");
  function csv(k) {
    const rows = data[k];
    if (!rows?.length) {
      setToast("No records to export yet");
      return;
    }
    const fields = [...new Set(rows.flatMap(Object.keys))].filter(
      (k) => !["comments"].includes(k),
    );
    const escape = (v) => {
      let text = String(typeof v === "object" ? JSON.stringify(v) : (v ?? ""));
      if (/^[=+@-]/.test(text)) text = "'" + text;
      return '"' + text.replaceAll('"', '""') + '"';
    };
    const blob = new Blob(
      [
        [
          fields.join(","),
          ...rows.map((r) => fields.map((f) => escape(r[f])).join(",")),
        ].join("\n"),
      ],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assetq-${k}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast("Export downloaded");
  }
  function table(k, cols) {
    let rows = list(k);
    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.label}>{c.label}</th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                onClick={() => setModal({ type: "detail", kind: k, record: r })}
              >
                {cols.map((c) => (
                  <td key={c.label}>
                    {c.render ? c.render(r) : r[c.key] || "—"}
                  </td>
                ))}
                <td>
                  <ChevronRight size={16} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <Empty
            title={
              search || filter !== "ALL"
                ? "No matching records"
                : "Your next chapter starts here"
            }
            text={
              search || filter !== "ALL"
                ? "Try a different search or filter."
                : `Add your first ${k === "assets" ? "asset" : k === "tickets" ? "ticket" : "record"} to see it here.`
            }
            action={
              addFor[page] && (
                <Button small onClick={() => openCreate(k)}>
                  <Plus size={15} /> Add {pretty(k).replace(/s$/, "")}
                </Button>
              )
            }
          />
        )}
        <div className="table-footer">
          <span>
            {rows.length} {pretty(k).toLowerCase()} · workspace data
          </span>
          <span>
            All changes are saved automatically <Check size={13} />
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="app">
      <aside className={"sidebar " + (mobile ? "mobile-open" : "")}>
        <Logo />
        <button className="workspace-switch" onClick={() => nav("settings")}>
          <span className="workspace-avatar">
            {data.tenant.name.slice(0, 1)}
          </span>
          <span>
            <strong>{data.tenant.name}</strong>
            <small>{data.tenant.settings.edition} workspace</small>
          </span>
          <ChevronDown size={15} />
        </button>
        <nav>
          <span className="nav-label">WORKSPACE</span>
          {[
            "overview",
            "assets",
            "tickets",
            "maintenance",
            "layouts",
            "knowledge",
            "finance",
            "approvals",
          ]
            .filter(accessible)
            .map((p) => {
              const I = icons[p];
              return (
                <button
                  key={p}
                  className={page === p ? "selected" : ""}
                  onClick={() => nav(p)}
                >
                  <I size={18} />
                  {labels[p]}
                  {p === "tickets" && openTickets.length > 0 && (
                    <span className="nav-count">{openTickets.length}</span>
                  )}
                  {p === "approvals" &&
                    data.approvals.some((a) => a.status === "PENDING") && (
                      <span className="nav-dot" />
                    )}
                </button>
              );
            })}
          <span className="nav-label second">ADMINISTRATION</span>
          {["automation", "masters", "users", "roles", "audit", "settings"]
            .filter(accessible)
            .map((p) => {
              const I = icons[p];
              return (
                <button
                  key={p}
                  className={page === p ? "selected" : ""}
                  onClick={() => nav(p)}
                >
                  <I size={18} />
                  {labels[p]}
                  {p === "automation" && <span className="nav-new">NEW</span>}
                </button>
              );
            })}
        </nav>
        <div className="sidebar-bottom">
          <div className="intelligence-note">
            <Sparkles size={19} />
            <strong>A little smarter, every day.</strong>
            <p>Put your routine work on autopilot.</p>
            <button
              onClick={() =>
                nav(can("automation") ? "automation" : "knowledge")
              }
            >
              Explore intelligence <ArrowUpRight size={14} />
            </button>
          </div>
          <button
            className="profile"
            onClick={() => setModal({ type: "profile" })}
          >
            <span className="avatar">
              {data.me.name
                .split(" ")
                .map((x) => x[0])
                .slice(0, 2)
                .join("")}
            </span>
            <span>
              <strong>{data.me.name}</strong>
              <small>{data.me.role}</small>
            </span>
            <MoreHorizontal size={18} />
          </button>
        </div>
      </aside>
      {mobile && (
        <div className="sidebar-scrim" onClick={() => setMobile(false)} />
      )}
      <div className="main">
        <header className="topbar">
          <div className="crumb">
            <button
              className="icon-btn hamburger"
              onClick={() => setMobile(!mobile)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <Building2 size={15} />
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{labels[page]}</strong>
          </div>
          <div className="top-actions">
            <span className="live-status">
              <span />
              {live ? "Workspace live" : "Setup in progress"}
            </span>
            <button
              className="icon-btn"
              aria-label="Help"
              onClick={() => setModal({ type: "help" })}
            >
              <CircleHelp size={19} />
            </button>
            <button
              className="icon-btn notification-button"
              aria-label="Notifications"
              onClick={() => setNotifications(!notifications)}
            >
              <Bell size={19} />
              {data.notifications.length > 0 && <i />}
            </button>
            <span className="avatar small-avatar">{data.me.name[0]}</span>
          </div>
        </header>
        {notifications && (
          <div className="notification-pop">
            <h3>
              Notification center <span>{data.notifications.length}</span>
            </h3>
            {data.notifications.length ? (
              data.notifications.slice(0, 10).map((n) => (
                <div key={n.id}>
                  <Bell size={16} />
                  <section>
                    <strong>{n.name}</strong>
                    <p>{n.body}</p>
                    <small>
                      {date(n.created_at)} · {n.channel}
                    </small>
                  </section>
                </div>
              ))
            ) : (
              <p>You’re all caught up. Automation alerts will appear here.</p>
            )}
            <small>
              In-app delivery · external channels require integration.
            </small>
          </div>
        )}
        <main className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {page === "overview"
                  ? "YOUR WORKSPACE, AT A GLANCE"
                  : page === "automation"
                    ? "WORK SMARTER"
                    : can("settings")
                      ? "ASSETQ WORKSPACE"
                      : "YOUR WORKSPACE"}
              </div>
              <h1>
                {page === "overview"
                  ? `Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${data.me.name.split(" ")[0]}`
                  : labels[page]}
                {page === "overview" && <span className="greeting-dot">.</span>}
              </h1>
              <p>
                {
                  {
                    overview: "A little clarity for everything you manage.",
                    assets: "Every asset. Every stage. One source of truth.",
                    tickets: "Great support starts with the right context.",
                    maintenance: "Stay ahead of downtime, one check at a time.",
                    layouts:
                      "See where your assets live. Keep the full picture.",
                    automation:
                      "Let the routine run itself. Keep the decisions yours.",
                    masters:
                      "Build the foundation for a well-connected workspace.",
                    users: "The right people, with the right access.",
                    roles:
                      "Clear responsibilities. Carefully controlled access.",
                    knowledge: "Answers worth sharing, all in one place.",
                    finance:
                      "Understand the value behind your asset portfolio.",
                    approvals:
                      "A thoughtful checkpoint for important decisions.",
                    audit: "A traceable history of your workspace.",
                    settings:
                      "Make AssetQ work the way your organization does.",
                  }[page]
                }
              </p>
            </div>
            <div className="heading-actions">
              {page === "overview" ? (
                <>
                  {can("settings") && (
                    <Button secondary onClick={() => setOnboard(true)}>
                      <SlidersHorizontal size={16} /> Setup guide
                    </Button>
                  )}
                  {can("assets") && (
                    <Button onClick={() => openCreate("assets")}>
                      <Plus size={17} /> Add asset
                    </Button>
                  )}
                </>
              ) : page === "automation" ? (
                <Button
                  onClick={() =>
                    run(
                      () => api("/automation/run", "POST", {}),
                      "Automation scan completed",
                    ).catch(() => {})
                  }
                >
                  <Zap size={16} /> Run automations
                </Button>
              ) : (
                addFor[page] && (
                  <>
                    {page === "assets" && can("assets") && (
                      <Button
                        secondary
                        onClick={() => setModal({ type: "import" })}
                      >
                        <Download size={16} /> Import CSV
                      </Button>
                    )}
                    {["assets", "tickets", "maintenance", "masters"].includes(
                      page,
                    ) && (
                      <Button
                        secondary
                        onClick={() => csv(page === "masters" ? master : page)}
                      >
                        <Download size={16} /> Export
                      </Button>
                    )}
                    <Button onClick={() => openCreate(addFor[page])}>
                      <Plus size={17} />{" "}
                      {page === "users"
                        ? "Add user"
                        : page === "roles"
                          ? "Create role"
                          : page === "tickets"
                            ? "Raise ticket"
                            : page === "masters"
                              ? "Add record"
                              : page === "layouts"
                                ? "Add floor plan"
                                : page === "knowledge"
                                  ? "Write article"
                                  : "Add " +
                                    (page === "assets"
                                      ? "asset"
                                      : "work order")}
                    </Button>
                  </>
                )
              )}
            </div>
          </div>
          {page === "overview" && (
            <>
              {!live && can("settings") && (
                <section className="setup-banner">
                  <div className="setup-banner-icon">
                    <Leaf size={27} />
                  </div>
                  <div>
                    <span className="mini-label">
                      A GREAT WORKSPACE STARTS HERE
                    </span>
                    <h3>Make yourself at home.</h3>
                    <p>
                      Set up your organization, bring your people in, and add
                      your first assets.
                    </p>
                    <div className="setup-progress">
                      <div>
                        <i style={{ width: `${(done / 4) * 100}%` }} />
                      </div>
                      <span>{done} of 4 steps complete</span>
                    </div>
                  </div>
                  <Button secondary onClick={() => setOnboard(true)}>
                    Continue setup <ArrowRight size={16} />
                  </Button>
                  <div className="banner-art">
                    <Boxes size={100} strokeWidth={0.65} />
                    <span />
                    <i />
                  </div>
                </section>
              )}
              <div className="section-caption">
                <h3>Workspace health</h3>
                <span>
                  <span className="dot" /> Live from your workspace
                </span>
              </div>
              <div className="kpi-grid">
                {[
                  [
                    Boxes,
                    "Total assets",
                    data.assets.length,
                    "Across your organization",
                    "assets",
                    "ALL",
                  ],
                  [
                    Ticket,
                    "Open tickets",
                    openTickets.length,
                    "Waiting for a little attention",
                    "tickets",
                    "OPEN",
                  ],
                  [
                    Wrench,
                    "Planned maintenance",
                    dueWork.length,
                    "Keep things running smoothly",
                    "maintenance",
                    "OUTSTANDING",
                  ],
                  [
                    ShieldCheck,
                    "SLA compliance",
                    data.tickets.length
                      ? Math.round(
                          (data.tickets.filter(slaCompliant).length /
                            data.tickets.length) *
                            100,
                        ) + "%"
                      : "—",
                    "Resolution within policy",
                    "tickets",
                    "WITHIN_SLA",
                  ],
                ].map(([I, l, v, sub, p, f], i) => (
                  <button
                    className="kpi"
                    key={l}
                    onClick={() => {
                      nav(p);
                      setFilter(f);
                    }}
                  >
                    <div className="kpi-top">
                      <span className={"kpi-icon k" + i}>
                        <I size={19} />
                      </span>
                      <ArrowUpRight size={16} />
                    </div>
                    <span className="kpi-label">{l}</span>
                    <strong>{v}</strong>
                    <small>{sub}</small>
                  </button>
                ))}
              </div>
              <div className="overview-grid">
                <section className="card portfolio">
                  <div className="card-title">
                    <div>
                      <h3>Asset portfolio</h3>
                      <p>A balanced view of your asset landscape.</p>
                    </div>
                    <button className="text-btn" onClick={() => nav("assets")}>
                      View register <ArrowUpRight size={14} />
                    </button>
                  </div>
                  <div className="portfolio-body">
                    <div
                      className="donut"
                      style={{
                        background: data.assets.length
                          ? "conic-gradient(#1b7957 0% " +
                            (data.assets.filter((a) => a.status === "ASSIGNED")
                              .length /
                              data.assets.length) *
                              100 +
                            "%, #b6d5c2 0% " +
                            (data.assets.filter((a) =>
                              ["ASSIGNED", "ACTIVE", "IN_STOCK"].includes(
                                a.status,
                              ),
                            ).length /
                              data.assets.length) *
                              100 +
                            "%, #eac378 0%, #eac378 100%)"
                          : undefined,
                      }}
                    >
                      <div>
                        <strong>{data.assets.length}</strong>
                        <span>Total assets</span>
                      </div>
                    </div>
                    <div className="legend">
                      {[
                        ["Assigned", "ASSIGNED", "#1b7957"],
                        ["Available", "IN_STOCK", "#b6d5c2"],
                        ["In repair", "IN_REPAIR", "#eac378"],
                        ["Other states", "OTHER", "#e8eeeb"],
                      ].map(([n, s, col]) => (
                        <button
                          key={s}
                          onClick={() => {
                            nav("assets");
                            setFilter(s === "OTHER" ? "ALL" : s);
                          }}
                        >
                          <span>
                            <i style={{ background: col }} />
                            {n}
                          </span>
                          <strong>
                            {s === "OTHER"
                              ? data.assets.filter(
                                  (a) =>
                                    ![
                                      "ASSIGNED",
                                      "IN_STOCK",
                                      "IN_REPAIR",
                                    ].includes(a.status),
                                ).length
                              : data.assets.filter((a) => a.status === s)
                                  .length}
                          </strong>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="card-foot">
                    <Leaf size={15} /> A clear inventory is the first step to
                    less waste.
                  </div>
                </section>
                <section className="card attention">
                  <div className="card-title">
                    <div>
                      <h3>Needs your attention</h3>
                      <p>The important things, brought to the surface.</p>
                    </div>
                    <span className="count-label">
                      {data.approvals.filter((a) => a.status === "PENDING")
                        .length + dueWork.length}
                    </span>
                  </div>
                  {!data.approvals.some((a) => a.status === "PENDING") &&
                  !dueWork.length ? (
                    <div className="calm">
                      <div>
                        <CheckCircle2 size={29} />
                      </div>
                      <strong>A little breathing room.</strong>
                      <p>
                        No pending approvals or maintenance work.
                        <br />
                        We’ll keep an eye on things for you.
                      </p>
                    </div>
                  ) : (
                    <div className="attention-list">
                      {[
                        ...data.approvals
                          .filter((a) => a.status === "PENDING")
                          .map((r) => ({ ...r, kind: "approvals" })),
                        ...dueWork.map((r) => ({ ...r, kind: "maintenance" })),
                      ]
                        .slice(0, 4)
                        .map((r) => (
                          <button
                            key={r.id}
                            onClick={() =>
                              setModal({
                                type: "detail",
                                kind: r.kind,
                                record: r,
                              })
                            }
                          >
                            <span className="attention-icon">
                              <Clock size={17} />
                            </span>
                            <span>
                              <strong>{r.name}</strong>
                              <small>
                                {r.code} · {pretty(r.status)}
                              </small>
                            </span>
                            <ChevronRight size={16} />
                          </button>
                        ))}
                    </div>
                  )}
                  <button
                    className="card-foot text-btn"
                    onClick={() =>
                      nav(can("approvals") ? "approvals" : "maintenance")
                    }
                  >
                    View all activity <ArrowRight size={14} />
                  </button>
                </section>
              </div>
              <div className="overview-bottom">
                <section className="card recent">
                  <div className="card-title">
                    <div>
                      <h3>Recently added assets</h3>
                      <p>
                        Your newest additions, ready for their next chapter.
                      </p>
                    </div>
                    <button className="text-btn" onClick={() => nav("assets")}>
                      View all <ArrowUpRight size={14} />
                    </button>
                  </div>
                  {data.assets.length ? (
                    <div className="recent-items">
                      {data.assets.slice(0, 4).map((a) => (
                        <button
                          key={a.id}
                          onClick={() =>
                            setModal({
                              type: "detail",
                              kind: "assets",
                              record: a,
                            })
                          }
                        >
                          <span className="asset-icon">
                            <Boxes size={19} />
                          </span>
                          <span>
                            <strong>{a.name}</strong>
                            <small>
                              {a.code} ·{" "}
                              {data.locations.find(
                                (l) => l.code === a.location_code,
                              )?.name || a.location_code}
                            </small>
                          </span>
                          <Badge value={a.status} />
                          <ChevronRight size={15} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      title="Room for your first asset."
                      text="Start with a laptop, a vehicle, or anything your team relies on."
                      action={
                        can("assets") && (
                          <button
                            className="text-btn"
                            onClick={() => openCreate("assets")}
                          >
                            Add your first asset <ArrowRight size={15} />
                          </button>
                        )
                      }
                    />
                  )}
                </section>
                <section className="intelligence-card">
                  <span className="intelligence-orbit">
                    <Sparkles size={27} />
                  </span>
                  <span className="mini-label">ASSETQ INTELLIGENCE</span>
                  <h3>
                    Less reacting.
                    <br />
                    More anticipating.
                  </h3>
                  <p>
                    Warranty reminders, maintenance scheduling, and smart ticket
                    assistance. Your team, a step ahead.
                  </p>
                  <button
                    onClick={() =>
                      nav(can("automation") ? "automation" : "tickets")
                    }
                  >
                    See what’s possible <ArrowUpRight size={16} />
                  </button>
                  <span className="intelligence-decoration">✳</span>
                </section>
              </div>
            </>
          )}
          {["assets", "tickets", "maintenance"].includes(page) && (
            <>
              <div className="list-tabs">
                {(page === "assets"
                  ? ["ALL", "ASSIGNED", "IN_STOCK", "IN_REPAIR", "DRAFT"]
                  : page === "tickets"
                    ? ["ALL", "NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"]
                    : ["ALL", "SCHEDULED", "IN_PROGRESS", "COMPLETED"]
                ).map((f) => (
                  <button
                    className={filter === f ? "active" : ""}
                    key={f}
                    onClick={() => setFilter(f)}
                  >
                    {f === "ALL" ? "All " + page : pretty(f)}{" "}
                    <span>
                      {f === "ALL"
                        ? data[page].length
                        : data[page].filter((r) => r.status === f).length}
                    </span>
                  </button>
                ))}
              </div>
              <div className="card list-card">
                <div className="table-toolbar">
                  <div className="search-input">
                    <Search size={17} />
                    <input
                      placeholder={`Search ${page}…`}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <span className="toolbar-note">
                    <SlidersHorizontal size={15} />{" "}
                    {filter === "ALL" ? "All records" : pretty(filter)}
                  </span>
                </div>
                {page === "assets"
                  ? table("assets", [
                      {
                        label: "Asset",
                        render: (r) => (
                          <div className="name-cell">
                            <span className="asset-icon">
                              <Boxes size={17} />
                            </span>
                            <span>
                              <strong>{r.name}</strong>
                              <small>{r.code}</small>
                            </span>
                          </div>
                        ),
                      },
                      {
                        label: "Category",
                        render: (r) =>
                          data.categories.find(
                            (c) => c.code === r.category_code,
                          )?.name || r.category_code,
                      },
                      {
                        label: "Assigned to",
                        render: (r) =>
                          data.users.find((u) => u.id === r.assigned_user_id)
                            ?.name || "Unassigned",
                      },
                      {
                        label: "Location",
                        render: (r) =>
                          data.locations.find((l) => l.code === r.location_code)
                            ?.name || r.location_code,
                      },
                      {
                        label: "Status",
                        render: (r) => <Badge value={r.status} />,
                      },
                      {
                        label: "Warranty",
                        render: (r) => date(r.warranty_end),
                      },
                    ])
                  : page === "tickets"
                    ? table("tickets", [
                        {
                          label: "Ticket",
                          render: (r) => (
                            <div className="name-cell">
                              <span className="asset-icon">
                                <Ticket size={17} />
                              </span>
                              <span>
                                <strong>{r.name}</strong>
                                <small>{r.code}</small>
                              </span>
                            </div>
                          ),
                        },
                        {
                          label: "Priority",
                          render: (r) => <Badge value={r.priority} />,
                        },
                        { label: "Group", key: "group" },
                        {
                          label: "Linked asset",
                          render: (r) =>
                            data.assets.find((a) => a.id === r.asset_id)
                              ?.code || "—",
                        },
                        {
                          label: "Status",
                          render: (r) => <Badge value={r.status} />,
                        },
                        {
                          label: "SLA due",
                          render: (r) => (
                            <span
                              className={
                                new Date(r.due_at) < new Date() &&
                                !["RESOLVED", "CLOSED"].includes(r.status)
                                  ? "danger"
                                  : ""
                              }
                            >
                              {date(r.due_at)}
                            </span>
                          ),
                        },
                      ])
                    : table("maintenance", [
                        {
                          label: "Work order",
                          render: (r) => (
                            <span>
                              <strong>{r.name}</strong>
                              <small className="block">{r.code}</small>
                            </span>
                          ),
                        },
                        {
                          label: "Asset",
                          render: (r) =>
                            data.assets.find((a) => a.id === r.asset_id)
                              ?.name || "—",
                        },
                        {
                          label: "Scheduled",
                          render: (r) => date(r.scheduled_date),
                        },
                        {
                          label: "Interval",
                          render: (r) => `${r.frequency_days || 90} days`,
                        },
                        {
                          label: "Status",
                          render: (r) => <Badge value={r.status} />,
                        },
                      ])}
              </div>
            </>
          )}
          {page === "masters" && (
            <>
              <div className="master-layout">
                <div className="master-nav">
                  {[
                    "locations",
                    "departments",
                    "categories",
                    "models",
                    "vendors",
                    "contracts",
                    "sla",
                    "services",
                    "depreciation",
                    "taxes",
                    "checklists",
                  ].map((k) => (
                    <button
                      className={master === k ? "active" : ""}
                      key={k}
                      onClick={() => {
                        setMaster(k);
                        setSearch("");
                        setFilter("ALL");
                      }}
                    >
                      {{
                        sla: "SLA policies",
                        depreciation: "Depreciation classes",
                        services: "Service catalog",
                        categories: "Asset categories",
                        models: "Asset models",
                        checklists: "Maintenance checklists",
                      }[k] || pretty(k)}
                      <span>{data[k].length}</span>
                    </button>
                  ))}
                </div>
                <div className="card list-card">
                  <div className="table-toolbar">
                    <h3>{pretty(master)}</h3>
                    <div className="search-input">
                      <Search size={16} />
                      <input
                        placeholder="Find a record…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  {table(master, [
                    { label: "Code", key: "code" },
                    { label: "Name", key: "name" },
                    {
                      label: "Status",
                      render: (r) => <Badge value={r.status} />,
                    },
                    { label: "Created", render: (r) => date(r.created_at) },
                  ])}
                </div>
              </div>
              <div className="info-strip">
                <Database size={17} /> Master codes stay fixed. Display names
                can change. Records are archived instead of deleted.
              </div>
            </>
          )}
          {page === "users" && (
            <div className="card list-card">
              <div className="table-toolbar">
                <div className="search-input">
                  <Search size={16} />
                  <input
                    placeholder="Search people…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <span>
                  {data.users.filter((u) => u.status === "ACTIVE").length}{" "}
                  active people
                </span>
              </div>
              {table("users", [
                {
                  label: "Team member",
                  render: (r) => (
                    <div className="name-cell">
                      <span className="avatar">{r.name[0]}</span>
                      <span>
                        <strong>{r.name}</strong>
                        <small>{r.email}</small>
                      </span>
                    </div>
                  ),
                },
                {
                  label: "Role",
                  render: (r) =>
                    data.roles.find((role) => role.id === r.role_id)?.name ||
                    "—",
                },
                { label: "Status", render: (r) => <Badge value={r.status} /> },
              ])}
            </div>
          )}
          {page === "roles" && (
            <>
              <div className="info-strip">
                <ShieldCheck size={18} /> Permissions are enforced by the API.
                Employees can see their own assets and tickets.
              </div>
              <div className="role-grid">
                {data.roles.map((r) => (
                  <section className="card role-card" key={r.id}>
                    <div className="role-title">
                      <span className="kpi-icon">
                        <ShieldCheck size={22} />
                      </span>
                      <button
                        className="icon-btn"
                        aria-label={"Edit " + r.name}
                        onClick={() => setModal({ type: "role", record: r })}
                      >
                        <SlidersHorizontal size={18} />
                      </button>
                    </div>
                    <h3>{r.name}</h3>
                    <p>
                      {data.users.filter((u) => u.role_id === r.id).length} team
                      members
                    </p>
                    <div className="permission-tags">
                      {r.permissions.length ? (
                        r.permissions.map((p) => (
                          <span key={p}>{pretty(p)}</span>
                        ))
                      ) : (
                        <span>Self-service access</span>
                      )}
                    </div>
                    <small>
                      {r.name === "Administrator"
                        ? "Protected system role"
                        : "Configurable workspace role"}
                    </small>
                  </section>
                ))}
              </div>
            </>
          )}
          {page === "automation" && (
            <>
              <div className="automation-banner">
                <Sparkles size={24} />
                <div>
                  <h3>Built-in intelligence. You stay in control.</h3>
                  <p>
                    Rules run every minute. Sensitive lifecycle actions always
                    need a different approver.
                  </p>
                </div>
                <span className="badge green">
                  {data.rules.filter((r) => r.enabled).length} active rules
                </span>
              </div>
              <div className="rule-grid">
                {data.rules.map((r) => (
                  <section className="card rule-card" key={r.id}>
                    <div className="rule-top">
                      <span className="rule-icon">
                        <Workflow size={20} />
                      </span>
                      <button
                        role="switch"
                        aria-checked={r.enabled}
                        aria-label={"Toggle " + r.name}
                        className={"toggle " + (r.enabled ? "on" : "")}
                        onClick={() =>
                          run(
                            () =>
                              api("/rules/" + r.id, "PATCH", {
                                enabled: !r.enabled,
                              }),
                            "Rule updated",
                          ).catch(() => {})
                        }
                      >
                        <span />
                      </button>
                    </div>
                    <span className="mini-label">
                      {r.code} · {r.event}
                    </span>
                    <h3>{r.name}</h3>
                    <p>{r.description}</p>
                    {r.threshold != null && (
                      <button
                        className="text-btn threshold-btn"
                        onClick={() =>
                          setModal({ type: "threshold", record: r })
                        }
                      >
                        <SlidersHorizontal size={13} /> Threshold: {r.threshold}
                        {r.event === "SLAAtRisk"
                          ? "% elapsed"
                          : r.event === "WarrantyExpiring"
                            ? " days"
                            : " incidents"}
                      </button>
                    )}
                    <div className="rule-foot">
                      <Badge value={r.enabled ? "ENABLED" : "DISABLED"} />
                      <span>
                        <Bell size={13} /> In-app
                      </span>
                    </div>
                  </section>
                ))}
              </div>
              <div className="card ai-connection">
                <Sparkles size={22} />
                <div>
                  <h3>AI helpdesk assistance</h3>
                  <p>
                    Ticket category and priority suggestions, duplicate
                    detection, and knowledge recommendations work locally.
                    Connect an AI model with server environment variables for
                    generated troubleshooting advice. Ticket text is sent only
                    when an agent requests assistance.
                  </p>
                </div>
                <button
                  className="text-btn"
                  onClick={() => setModal({ type: "help" })}
                >
                  Integration details <ArrowUpRight size={15} />
                </button>
              </div>
            </>
          )}
          {page === "approvals" && (
            <div className="card list-card">
              {table("approvals", [
                {
                  label: "Request",
                  render: (r) => (
                    <span>
                      <strong>{r.name}</strong>
                      <small className="block">{r.code}</small>
                    </span>
                  ),
                },
                { label: "Reason", key: "reason" },
                {
                  label: "Requested by",
                  render: (r) =>
                    data.users.find((u) => u.id === r.requested_by)?.name ||
                    "Team member",
                },
                { label: "Status", render: (r) => <Badge value={r.status} /> },
                { label: "Date", render: (r) => date(r.created_at) },
              ])}
            </div>
          )}
          {page === "knowledge" && (
            <>
              <div className="search-input knowledge-search">
                <Search size={19} />
                <input
                  placeholder="Find an answer, a guide, a better way…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="knowledge-grid">
                {list("knowledge").map((r) => (
                  <button
                    className="card knowledge-card"
                    key={r.id}
                    onClick={() =>
                      setModal({ type: "detail", kind: "knowledge", record: r })
                    }
                  >
                    <BookOpen size={23} />
                    <span className="mini-label">
                      {r.category || "WORKSPACE GUIDE"}
                    </span>
                    <h3>{r.name}</h3>
                    <p>{r.body}</p>
                    <span className="text-btn">
                      Read article <ArrowRight size={15} />
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
          {page === "finance" && (
            <>
              <div className="kpi-grid finance-kpis">
                {[
                  [
                    "Acquisition value",
                    data.assets.reduce((s, a) => s + Number(a.cost || 0), 0),
                  ],
                  [
                    "Estimated book value",
                    data.assets.reduce((s, a) => s + bookValue(a, data), 0),
                  ],
                  [
                    "Estimated depreciation",
                    data.assets.reduce(
                      (s, a) => s + Number(a.cost || 0) - bookValue(a, data),
                      0,
                    ),
                  ],
                ].map(([l, v]) => (
                  <div className="kpi" key={l}>
                    <span className="kpi-label">{l}</span>
                    <strong>{currency(v)}</strong>
                    <small>Calculated from recorded asset values</small>
                  </div>
                ))}
              </div>
              <div className="card list-card">
                {table("assets", [
                  { label: "Asset", key: "name" },
                  {
                    label: "Cost center",
                    render: (r) =>
                      data.departments.find((d) => d.code === r.department_code)
                        ?.cost_center || "—",
                  },
                  {
                    label: "Method",
                    render: (r) =>
                      data.depreciation.find(
                        (d) => d.code === r.depreciation_code,
                      )?.method || "SLM",
                  },
                  {
                    label: "Acquisition cost",
                    render: (r) => currency(r.cost),
                  },
                  {
                    label: "Book value",
                    render: (r) => currency(bookValue(r, data)),
                  },
                  {
                    label: "Status",
                    render: (r) => <Badge value={r.status} />,
                  },
                ])}
              </div>
              <div className="info-strip">
                <Wallet size={17} /> Estimates use your depreciation class and
                activation date. No purchase management or accounting postings
                are included.
              </div>
            </>
          )}
          {page === "audit" && (
            <div className="card list-card">
              <div className="table-toolbar">
                <h3>Workspace activity</h3>
                <Button secondary small onClick={() => csv("audit")}>
                  <Download size={14} /> Export audit
                </Button>
              </div>
              {table("audit", [
                {
                  label: "Event",
                  render: (r) => (
                    <strong>
                      {r.event.replace(/([a-z])([A-Z])/g, "$1 $2")}
                    </strong>
                  ),
                },
                { label: "Actor", key: "actor" },
                { label: "Record", key: "target" },
                {
                  label: "Recorded at",
                  render: (r) => new Date(r.created_at).toLocaleString(),
                },
              ])}
            </div>
          )}
          {page === "layouts" && (
            <Layouts data={data} run={run} setModal={setModal} />
          )}
          {page === "settings" && (
            <SettingsPage
              data={data}
              run={run}
              onSetup={() => setOnboard(true)}
            />
          )}
          <footer className="page-footer">
            <span>
              <span className="dot" /> All systems connected
            </span>
            <span>
              Thoughtfully built. Simply managed. <Leaf size={13} />
            </span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
          <button onClick={() => setToast("")} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}
      {onboard && (
        <Modal
          title="Your workspace, ready for day one."
          subtitle="A few simple steps. A strong foundation."
          wide
          onClose={() => setOnboard(false)}
        >
          <div className="onboard-intro">
            <div className="onboard-progress">
              <strong>{done}/4</strong>
              <span>steps complete</span>
            </div>
            <p>
              Start with your master data, create your team’s accounts, and
              register your assets. Defaults for roles, service levels, and
              automation are already in place.
            </p>
          </div>
          <div className="onboard-steps">
            {steps.map((s, i) => (
              <button
                key={s.title}
                onClick={() => {
                  nav(s.page);
                  setOnboard(false);
                }}
              >
                <span className={"step-number " + (s.done ? "complete" : "")}>
                  {s.done ? <Check size={18} /> : i + 1}
                </span>
                <span>
                  <strong>{s.title}</strong>
                  <small>{s.text}</small>
                </span>
                {s.done ? (
                  <Badge value="COMPLETED" />
                ) : (
                  <ArrowRight size={18} />
                )}
              </button>
            ))}
          </div>
          <div className="onboard-review">
            <input
              id="review-workflow"
              type="checkbox"
              checked={!!data.tenant.settings.reviewed}
              onChange={async (e) => {
                const reviewed = e.target.checked;
                setData((prev) => ({
                  ...prev,
                  tenant: {
                    ...prev.tenant,
                    settings: { ...prev.tenant.settings, reviewed },
                  },
                }));
                try {
                  await run(() => api("/settings", "PATCH", { reviewed }));
                } catch {
                  await reload();
                }
              }}
            />
            <label htmlFor="review-workflow">
              I have reviewed the default roles, SLA policies, and automation
              rules.
            </label>
          </div>
          <div className="modal-footer">
            <span>
              {live
                ? "Your workspace is live."
                : "No sample assets. This workspace is yours."}
            </span>
            <Button
              disabled={done < 4 || live}
              onClick={() =>
                run(
                  () => api("/settings", "PATCH", { live: true }),
                  "Your workspace is live!",
                )
                  .then(() => setOnboard(false))
                  .catch(() => {})
              }
            >
              {live ? "Workspace live" : "Go live"} <ArrowRight size={16} />
            </Button>
          </div>
        </Modal>
      )}
      {modal?.type === "import" && (
        <ImportAssets data={data} run={run} onClose={() => setModal(null)} />
      )}
      {modal?.type === "threshold" && (
        <ThresholdEditor
          record={modal.record}
          run={run}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "create" && (
        <CreateForm
          kind={modal.kind}
          data={data}
          run={run}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "detail" && (
        <Detail
          kind={modal.kind}
          record={
            (data[modal.kind] || []).find((r) => r.id === modal.record.id) ||
            modal.record
          }
          data={data}
          run={run}
          onClose={() => setModal(null)}
          setModal={setModal}
          currency={currency}
        />
      )}
      {modal?.type === "role" && (
        <RoleEditor
          record={modal.record}
          data={data}
          run={run}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "profile" && (
        <Modal
          title="Your account"
          subtitle={data.tenant.name}
          onClose={() => setModal(null)}
        >
          <PasswordChange run={run} />
          <div className="profile-detail">
            <span className="avatar">{data.me.name[0]}</span>
            <h3>{data.me.name}</h3>
            <p>{data.me.email}</p>
            <Badge value={data.me.role} />
          </div>
          <div className="modal-footer">
            <span>Workspace ID: {data.tenant.code}</span>
            <Button
              secondary
              onClick={async () => {
                await api("/logout", "POST", {});
                setData(null);
                setModal(null);
              }}
            >
              <LogOut size={16} /> Sign out
            </Button>
          </div>
        </Modal>
      )}
      {modal?.type === "help" && (
        <Modal
          title="A little help, when you need it."
          onClose={() => setModal(null)}
        >
          <div className="help-content">
            <h3>Getting started</h3>
            <p>
              Open the setup guide to add locations and departments, create
              users, and register your first asset. Review the defaults, then go
              live.
            </p>
            <h3>Team access</h3>
            <p>
              Create users with an initial password and share it through your
              organization’s secure channel. Each person signs in using your
              workspace ID: <strong>{data.tenant.code}</strong>.
            </p>
            <h3>AI & integrations</h3>
            <p>
              Local ticket assistance works immediately. For generated AI
              suggestions, configure ASSETQ_AI_KEY and optionally
              ASSETQ_AI_MODEL on the server. External email, SMS, WhatsApp, SSO,
              and billing integrations require provider setup; they are not
              connected in this version.
            </p>
            <h3>Human approval</h3>
            <p>
              Transfers, retirement, and disposal require an approval request
              reviewed by a different authorized user.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
function slaCompliant(t) {
  return ["RESOLVED", "CLOSED"].includes(t.status)
    ? !!t.resolved_at && new Date(t.resolved_at) <= new Date(t.due_at)
    : new Date(t.due_at) > new Date();
}
function bookValue(a, data) {
  const cost = Number(a.cost) || 0,
    d = data.depreciation.find((d) => d.code === a.depreciation_code),
    life = Number(d?.life_months) || 36,
    residual = cost * (Number(d?.residual_percent ?? 10) / 100);
  const months = a.activation_date
    ? Math.max(
        0,
        (Date.now() - new Date(a.activation_date).getTime()) /
          (86400000 * 30.4375),
      )
    : 0;
  return d?.method === "WDV"
    ? Math.max(
        residual,
        cost * Math.pow(residual / cost || 0.1, Math.min(months, life) / life),
      )
    : Math.max(residual, cost - (cost - residual) * Math.min(months / life, 1));
}
const schema = {
  assets: [
    ["code", "Asset tag", "text", true],
    ["name", "Asset name", "text", true],
    ["category_code", "Category", "categories", true],
    ["model_code", "Model", "models"],
    ["serial_number", "Serial number"],
    ["location_code", "Location", "locations", true],
    ["department_code", "Department", "departments"],
    ["assigned_user_id", "Owner", "users"],
    ["vendor_code", "Warranty / service vendor", "vendors"],
    ["status", "Lifecycle state", ["DRAFT", "ACTIVE", "IN_STOCK", "ASSIGNED"]],
    ["warranty_end", "Warranty end", "date"],
    ["next_due", "Next maintenance", "date"],
    ["frequency_days", "Service interval (days)", "number"],
    ["cost", "Acquisition value", "number"],
    ["activation_date", "Activation date", "date"],
    ["depreciation_code", "Depreciation class", "depreciation"],
    ["description", "Notes", "textarea"],
  ],
  tickets: [
    ["name", "What do you need help with?", "text", true],
    ["description", "Describe the issue", "textarea", true],
    ["type", "Ticket type", ["INCIDENT", "REQUEST", "WORK_ORDER"], true],
    ["asset_id", "Related asset", "assets"],
    ["priority", "Priority", ["P1", "P2", "P3", "P4", "P5"]],
    ["category", "Category", ["Hardware", "Software", "Network", "Facilities"]],
    ["group", "Assignment group", ["IT support", "Facilities"]],
  ],
  maintenance: [
    ["name", "Work order name", "text", true],
    ["asset_id", "Asset", "assets", true],
    ["scheduled_date", "Scheduled date", "date", true],
    ["frequency_days", "Repeat every (days)", "number", true],
    ["group", "Assignment group", ["IT support", "Facilities"]],
    ["checklist", "Checklist (one step per line)", "textarea"],
  ],
  locations: [
    ["code", "Location code", "text", true],
    ["name", "Location name", "text", true],
    [
      "type",
      "Location type",
      ["SITE", "BUILDING", "FLOOR", "ROOM", "STORE"],
      true,
    ],
    ["parent_location_code", "Parent location", "locations"],
  ],
  departments: [
    ["code", "Department code", "text", true],
    ["name", "Department name", "text", true],
    ["cost_center", "Cost center"],
    ["approver_id", "Default approver", "users"],
  ],
  categories: [
    ["code", "Category code", "text", true],
    ["name", "Category name", "text", true],
    ["domain", "Asset domain", ["IT", "NON_IT"], true],
    ["sla_code", "Default SLA", "sla"],
    ["depreciation_code", "Depreciation class", "depreciation"],
  ],
  models: [
    ["code", "Model code", "text", true],
    ["name", "Model name", "text", true],
    ["manufacturer", "Manufacturer"],
    ["category_code", "Category", "categories", true],
    ["warranty_months", "Default warranty (months)", "number"],
  ],
  vendors: [
    ["code", "Vendor code", "text", true],
    ["name", "Vendor name", "text", true],
    ["type", "Vendor type", ["OEM", "SUPPLIER", "SERVICE"], true],
    ["email", "Contact email", "email"],
    ["phone", "Phone"],
    ["tax_id", "Tax ID"],
  ],
  contracts: [
    ["code", "Contract code", "text", true],
    ["name", "Contract name", "text", true],
    ["vendor_code", "Vendor", "vendors", true],
    ["type", "Contract type", ["AMC", "WARRANTY"], true],
    ["start_date", "Start date", "date"],
    ["end_date", "End date", "date", true],
    ["sla_code", "SLA policy", "sla"],
  ],
  sla: [
    ["code", "SLA code", "text", true],
    ["name", "Policy name", "text", true],
    ["priority", "Priority", ["P1", "P2", "P3", "P4", "P5"], true],
    ["response_minutes", "Response (minutes)", "number", true],
    ["resolution_minutes", "Resolution (minutes)", "number", true],
    ["calendar", "Calendar", ["24x7"]],
  ],
  services: [
    ["code", "Service code", "text", true],
    ["name", "Service name", "text", true],
    ["type", "Service type", ["INCIDENT", "REQUEST", "WORK_ORDER"], true],
    ["group", "Assignment group", ["IT support", "Facilities"]],
    ["sla_code", "Default SLA", "sla"],
  ],
  depreciation: [
    ["code", "Class code", "text", true],
    ["name", "Class name", "text", true],
    ["method", "Method", ["SLM", "WDV"], true],
    ["life_months", "Useful life (months)", "number", true],
    ["residual_percent", "Residual value (%)", "number", true],
    ["gl_asset_account", "Asset GL account"],
    ["gl_dep_account", "Depreciation GL account"],
  ],
  taxes: [
    ["code", "Tax code", "text", true],
    ["name", "Tax name", "text", true],
    ["rate", "Tax rate (%)", "number", true],
    ["gl_tax_account", "Tax GL account"],
  ],
  checklists: [
    ["code", "Checklist code", "text", true],
    ["name", "Checklist name", "text", true],
    ["steps", "Steps (one per line)", "textarea", true],
  ],
  knowledge: [
    ["name", "Article title", "text", true],
    ["category", "Category", ["Hardware", "Software", "Network", "Facilities"]],
    ["body", "Article content", "textarea", true],
  ],
  users: [
    ["name", "Full name", "text", true],
    ["email", "Work email", "email", true],
    ["role_id", "Role", "roles", true],
    ["password", "Initial password", "password", true],
  ],
  layouts: [
    ["name", "Floor plan name", "text", true],
    ["location_code", "Location", "locations", true],
  ],
};
function CreateForm({ kind, data, run, onClose }) {
  const defaults = {
    assets: { status: "DRAFT", frequency_days: 90, cost: 0 },
    tickets: { priority: "P3", type: "INCIDENT" },
    maintenance: { frequency_days: 90 },
    sla: { calendar: "24x7" },
    depreciation: { method: "SLM", life_months: 36, residual_percent: 10 },
  };
  const [f, setF] = useState(defaults[kind] || {}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [assist, setAssist] = useState(null),
    [aiBusy, setAiBusy] = useState(false),
    [permissions, setPermissions] = useState([]);
  const put = (k, v) => setF((prev) => ({ ...prev, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await run(
        () =>
          api(
            kind === "roles"
              ? "/roles"
              : kind === "users"
                ? "/users"
                : "/records/" + kind,
            "POST",
            kind === "roles" ? { ...f, permissions } : f,
          ),
        pretty(kind).replace(/s$/, "") + " created",
      );
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const fields =
    kind === "roles"
      ? [["name", "Role name", "text", true]]
      : schema[kind] || [["name", "Name", "text", true]];
  const help = async () => {
    setAiBusy(true);
    try {
      setAssist(await api("/assist", "POST", f));
    } catch (e) {
      setError(e.message);
    } finally {
      setAiBusy(false);
    }
  };
  return (
    <Modal
      title={
        kind === "tickets"
          ? "Let’s get that sorted."
          : kind === "users"
            ? "Welcome someone new."
            : kind === "assets"
              ? "Give your asset a home."
              : kind === "roles"
                ? "Create a custom role."
                : "Add " + pretty(kind).replace(/s$/, "")
      }
      subtitle={
        kind === "users"
          ? "Create an account, assign a role, and securely share the initial password."
          : "Your workspace. Your data. All changes are recorded."
      }
      wide
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          {fields.map(([key, label, type = "text", required]) => {
            let options = Array.isArray(type)
              ? type
              : data[type]?.map((o) => ({
                  value: ["users", "roles", "assets"].includes(type)
                    ? o.id
                    : o.code,
                  label: o.name,
                }));
            return (
              <div
                className={type === "textarea" ? "full-width" : ""}
                key={key}
              >
                <Field
                  label={label}
                  type={options ? "text" : type}
                  options={options}
                  required={required}
                  value={f[key]}
                  min={type === "number" ? 0 : undefined}
                  step={type === "number" ? "any" : undefined}
                  onChange={(v) => put(key, type === "number" ? Number(v) : v)}
                  hint={
                    key === "password"
                      ? "At least 10 characters. Share using a secure channel."
                      : key === "code"
                        ? "A unique code. It cannot be changed later."
                        : undefined
                  }
                />
              </div>
            );
          })}
        </div>
        {kind === "roles" && (
          <div className="permission-checkboxes">
            {data.permissions.map((p) => (
              <label key={p}>
                <input
                  type="checkbox"
                  checked={permissions.includes(p)}
                  onChange={(e) =>
                    setPermissions(
                      e.target.checked
                        ? [...permissions, p]
                        : permissions.filter((x) => x !== p),
                    )
                  }
                />
                {labels[p] || pretty(p)}
              </label>
            ))}
          </div>
        )}
        {kind === "layouts" && (
          <Field
            label="Floor plan image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={() => {}}
            onInput={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              if (file.size > 1000000) {
                setError("Choose an image smaller than 1 MB");
                return;
              }
              const reader = new FileReader();
              reader.onload = () => put("image", reader.result);
              reader.readAsDataURL(file);
            }}
          />
        )}
        {kind === "tickets" && (
          <div className="assist-box">
            <div className="assist-title">
              <span>
                <Sparkles size={18} /> A helpful second opinion
              </span>
              <Button
                small
                secondary
                type="button"
                disabled={!f.name || aiBusy}
                onClick={help}
              >
                {aiBusy ? "Thinking…" : "Suggest category & priority"}
              </Button>
            </div>
            {assist ? (
              <>
                <small>{assist.source}</small>
                <p>{assist.summary}</p>
                {assist.ai_suggestion && (
                  <p className="pre-wrap">{assist.ai_suggestion}</p>
                )}
                {assist.duplicates.length > 0 && (
                  <div className="warning">
                    Similar tickets:{" "}
                    {assist.duplicates.map((t) => t.code).join(", ")}
                  </div>
                )}
                {assist.articles.map((a) => (
                  <div className="kb-suggestion" key={a.id}>
                    <BookOpen size={16} />
                    <span>
                      <strong>{a.name}</strong>
                      <small>{a.body}</small>
                    </span>
                  </div>
                ))}
                <button
                  className="text-btn"
                  type="button"
                  onClick={() =>
                    setF({
                      ...f,
                      category: assist.category,
                      priority: assist.priority,
                      group: assist.group,
                    })
                  }
                >
                  Apply suggestions <Check size={15} />
                </button>
                {assist.ai_error && <p>{assist.ai_error}</p>}
              </>
            ) : (
              <p>
                Review suggested routing, spot similar issues, and find useful
                knowledge articles before submitting.
              </p>
            )}
          </div>
        )}
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <div className="modal-footer">
          <span>
            <ShieldCheck size={14} /> Saved to {data.tenant.name}
          </span>
          <div>
            <Button secondary type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={busy}>
              {busy ? (
                <Loader2 className="spin" size={16} />
              ) : (
                <Plus size={16} />
              )}{" "}
              {kind === "tickets"
                ? "Submit ticket"
                : kind === "users"
                  ? "Create account"
                  : "Create " + pretty(kind).replace(/s$/, "")}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
function Detail({ kind, record: r, data, run, onClose, currency }) {
  const [checks, setChecks] = useState([]);
  const [error, setError] = useState(""),
    [f, setF] = useState({}),
    [note, setNote] = useState(""),
    [assist, setAssist] = useState(null),
    [busy, setBusy] = useState(false),
    [action, setAction] = useState(""),
    [reason, setReason] = useState(""),
    [destination, setDestination] = useState("");
  const can = (p) => data.me.permissions.includes(p),
    write =
      kind === "assets"
        ? can("assets")
        : kind === "tickets"
          ? can("tickets")
          : kind === "users"
            ? can("users")
            : kind === "maintenance"
              ? can("maintenance")
              : schema[kind]
                ? can(kind === "knowledge" ? "tickets" : "masters")
                : false;
  const execute = async (fn, msg, clearNote = false) => {
    setError("");
    setBusy(true);
    try {
      await run(fn, msg);
      setF({});
      if (clearNote) setNote("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const states = {
    DRAFT: ["ACTIVE", "ARCHIVED"],
    ACTIVE: ["IN_STOCK", "ASSIGNED", "IN_REPAIR", "MAINTENANCE"],
    IN_STOCK: ["ASSIGNED", "IN_REPAIR"],
    ASSIGNED: ["IN_REPAIR", "MAINTENANCE"],
    IN_REPAIR: ["ASSIGNED", "IN_STOCK"],
    MAINTENANCE: ["ASSIGNED", "IN_STOCK"],
    TRANSFERRED: ["ASSIGNED", "IN_STOCK"],
    RETIRED: ["ARCHIVED"],
    DISPOSED: ["ARCHIVED"],
    ARCHIVED: [],
  };
  let fields = (schema[kind] || []).filter(
    ([k]) => !["code", "password"].includes(k),
  );
  if (kind === "assets")
    fields = fields.filter(([k]) => !["status"].includes(k));
  if (kind === "tickets")
    fields = [
      ["name", "Ticket title"],
      ["description", "Description", "textarea"],
      ["priority", "Priority", ["P1", "P2", "P3", "P4", "P5"]],
      ["group", "Assignment group", ["IT support", "Facilities"]],
      ["assigned_user_id", "Assigned agent", "users"],
      [
        "status",
        "Ticket status",
        [
          "NEW",
          "ASSIGNED",
          "IN_PROGRESS",
          "PENDING_USER",
          "PENDING_VENDOR",
          "RESOLVED",
          "CLOSED",
          "REOPENED",
        ],
      ],
    ];
  if (kind === "users")
    fields = [
      ["role_id", "Role", "roles"],
      ["status", "Account status", ["ACTIVE", "BLOCKED"]],
    ];
  return (
    <Modal
      title={r.name || r.event}
      subtitle={r.code || "Workspace activity"}
      wide
      onClose={onClose}
    >
      <div className="detail-top">
        <Badge value={r.status || r.priority || "ACTIVE"} />
        <span>Created {date(r.created_at)}</span>
        {kind === "assets" && <span>{currency(r.cost)} acquisition value</span>}
      </div>
      {kind === "approvals" ? (
        <>
          <div className="info-strip">
            <FileCheck size={20} /> {r.reason}
          </div>
          <dl className="detail-dl">
            <dt>Action</dt>
            <dd>{pretty(r.action)}</dd>
            <dt>Asset</dt>
            <dd>{data.assets.find((a) => a.id === r.asset_id)?.name || "—"}</dd>
            <dt>Requester</dt>
            <dd>
              {data.users.find((u) => u.id === r.requested_by)?.name ||
                "Team member"}
            </dd>
          </dl>
          {r.status === "PENDING" && (
            <>
              <p className="muted">
                A different authorized user must review this request.
              </p>
              <div className="modal-footer">
                <span>Approval is recorded in the audit trail.</span>
                <div>
                  <Button
                    secondary
                    disabled={busy || r.requested_by === data.me.id}
                    onClick={() =>
                      execute(
                        () =>
                          api("/approvals/" + r.id, "POST", {
                            decision: "REJECTED",
                          }),
                        "Request rejected",
                      )
                    }
                  >
                    Reject
                  </Button>
                  <Button
                    disabled={busy || r.requested_by === data.me.id}
                    onClick={() =>
                      execute(
                        () =>
                          api("/approvals/" + r.id, "POST", {
                            decision: "APPROVED",
                          }),
                        "Request approved",
                      )
                    }
                  >
                    Approve <Check size={16} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      ) : kind === "audit" ? (
        <div className="help-content">
          <p>
            {r.actor} · {new Date(r.created_at).toLocaleString()}
          </p>
          <pre>{JSON.stringify(r.details, null, 2)}</pre>
        </div>
      ) : (
        <>
          <div className="form-grid">
            {fields.map(([key, label, type = "text"]) => {
              const options = Array.isArray(type)
                ? type
                : data[type]?.map((o) => ({
                    value: ["users", "roles", "assets"].includes(type)
                      ? o.id
                      : o.code,
                    label: o.name,
                  }));
              return (
                <div
                  key={key}
                  className={type === "textarea" ? "full-width" : ""}
                >
                  <Field
                    label={label}
                    value={f[key] ?? r[key] ?? ""}
                    type={options ? "text" : type}
                    options={options}
                    disabled={
                      busy ||
                      !write ||
                      (kind === "users" && r.id === data.me.id)
                    }
                    onChange={(v) =>
                      setF({ ...f, [key]: type === "number" ? Number(v) : v })
                    }
                  />
                </div>
              );
            })}
          </div>
          {kind === "assets" && (
            <>
              <div className="detail-section">
                <h3>
                  <Workflow size={18} /> Lifecycle & governance
                </h3>
                <div className="lifecycle-line">
                  {["DRAFT", "ACTIVE", "ASSIGNED", "RETIRED", "DISPOSED"].map(
                    (s) => (
                      <span key={s} className={r.status === s ? "current" : ""}>
                        {pretty(s)}
                      </span>
                    ),
                  )}
                </div>
                {write && (
                  <>
                    <Field
                      label="Next lifecycle state"
                      value={f.status ?? r.status}
                      options={[r.status, ...(states[r.status] || [])]}
                      onChange={(v) => setF({ ...f, status: v })}
                    />
                    <div className="governed-actions">
                      <span>Approval required</span>
                      {(r.status === "RETIRED"
                        ? ["DISPOSED"]
                        : [
                              "ACTIVE",
                              "IN_STOCK",
                              "ASSIGNED",
                              "IN_REPAIR",
                            ].includes(r.status)
                          ? [
                              "RETIRED",
                              ...(["IN_STOCK", "ASSIGNED"].includes(r.status)
                                ? ["TRANSFERRED"]
                                : []),
                            ]
                          : []
                      ).map((s) => (
                        <Button
                          small
                          secondary
                          key={s}
                          onClick={() => setAction(s)}
                        >
                          {pretty(s)} <FileCheck size={14} />
                        </Button>
                      ))}
                    </div>
                    {action && (
                      <div className="approval-form">
                        <h4>Request {pretty(action).toLowerCase()}</h4>
                        <Field
                          label="Reason"
                          type="textarea"
                          value={reason}
                          onChange={setReason}
                        />
                        {action === "TRANSFERRED" && (
                          <Field
                            label="Destination"
                            value={destination}
                            onChange={setDestination}
                            options={data.locations.map((l) => ({
                              value: l.code,
                              label: l.name,
                            }))}
                          />
                        )}
                        <Button
                          small
                          disabled={!reason || busy}
                          onClick={() =>
                            execute(
                              () =>
                                api("/assets/" + r.id + "/request", "POST", {
                                  action,
                                  reason,
                                  location_code: destination,
                                }),
                              "Approval request submitted",
                            ).then(() => setAction(""))
                          }
                        >
                          Submit for approval <ArrowRight size={14} />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="detail-section">
                <h3>
                  <Ticket size={18} /> Linked support history
                </h3>
                {data.tickets
                  .filter((t) => t.asset_id === r.id)
                  .map((t) => (
                    <div className="linked-record" key={t.id}>
                      <span>
                        {t.code} · {t.name}
                      </span>
                      <Badge value={t.status} />
                    </div>
                  ))}
                {!data.tickets.some((t) => t.asset_id === r.id) && (
                  <p className="muted">No incidents recorded for this asset.</p>
                )}
              </div>
              <div className="detail-section">
                <h3>
                  <ShieldCheck size={18} /> Asset verification
                </h3>
                <p className="muted">
                  Last verified:{" "}
                  {r.verified_at ? date(r.verified_at) : "Not verified yet"}
                </p>
                {write && (
                  <Button
                    small
                    secondary
                    onClick={() =>
                      execute(
                        () =>
                          api("/records/assets/" + r.id, "PATCH", {
                            verified_at: new Date().toISOString(),
                          }),
                        "Asset verification recorded",
                      )
                    }
                  >
                    Verify physical asset <CheckCircle2 size={15} />
                  </Button>
                )}
              </div>
            </>
          )}
          {kind === "maintenance" && (
            <div className="detail-section">
              <h3>
                <Wrench size={18} /> Complete the work
              </h3>
              {(
                r.checklist ||
                "Inspect condition\nPerform safety checks\nRecord findings"
              )
                .split("\n")
                .map((step, i) => (
                  <label className="check-step" key={i}>
                    <input
                      type="checkbox"
                      checked={
                        r.status === "COMPLETED"
                          ? (r.completed_steps || []).includes(step)
                          : checks.includes(step)
                      }
                      onChange={(e) =>
                        setChecks(
                          e.target.checked
                            ? [...checks, step]
                            : checks.filter((x) => x !== step),
                        )
                      }
                      disabled={r.status === "COMPLETED"}
                    />{" "}
                    {step}
                  </label>
                ))}
              <Field
                label="Findings & maintenance notes"
                type="textarea"
                value={note || r.notes || ""}
                onChange={setNote}
                disabled={r.status === "COMPLETED"}
              />
              {r.status !== "COMPLETED" && write && (
                <Button
                  disabled={
                    !note ||
                    busy ||
                    checks.length !==
                      (
                        r.checklist ||
                        "Inspect condition\nPerform safety checks\nRecord findings"
                      ).split("\n").length
                  }
                  onClick={() =>
                    execute(
                      () =>
                        api("/maintenance/" + r.id + "/complete", "POST", {
                          notes: note,
                          completed_steps: checks,
                        }),
                      "Maintenance completed; next service scheduled",
                      true,
                    )
                  }
                >
                  Complete work order <CheckCircle2 size={16} />
                </Button>
              )}
            </div>
          )}
          {kind === "tickets" && (
            <>
              <div className="assist-box">
                <div className="assist-title">
                  <span>
                    <Sparkles size={18} /> Helpdesk intelligence
                  </span>
                  <Button
                    small
                    secondary
                    disabled={busy}
                    onClick={() =>
                      execute(async () =>
                        setAssist(await api("/assist", "POST", r)),
                      )
                    }
                  >
                    Get assistance
                  </Button>
                </div>
                {assist && (
                  <>
                    <small>{assist.source}</small>
                    <p>{assist.summary}</p>
                    {assist.ai_suggestion && (
                      <p className="pre-wrap">{assist.ai_suggestion}</p>
                    )}
                    {assist.articles.map((a) => (
                      <div className="kb-suggestion" key={a.id}>
                        <BookOpen size={16} />
                        <span>
                          <strong>{a.name}</strong>
                          <small>{a.body}</small>
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
              <div className="detail-section">
                <h3>Conversation</h3>
                {(r.comments || []).map((c, i) => (
                  <div className="comment" key={i}>
                    <strong>{c.author}</strong>
                    <small>{date(c.at)}</small>
                    <p>{c.body}</p>
                  </div>
                ))}
                {r.status !== "CLOSED" && (
                  <>
                    <Field
                      label="Add a reply"
                      type="textarea"
                      value={note}
                      onChange={setNote}
                    />
                    <Button
                      small
                      secondary
                      disabled={!note || busy}
                      onClick={() =>
                        execute(
                          () =>
                            api("/tickets/" + r.id + "/comments", "POST", {
                              body: note,
                            }),
                          "Reply posted",
                          true,
                        )
                      }
                    >
                      Post reply <ArrowRight size={14} />
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
          {write && kind !== "maintenance" && (
            <div className="modal-footer">
              <span>
                {Object.keys(f).length
                  ? "Unsaved changes"
                  : "All changes are audited"}
              </span>
              <Button
                disabled={!Object.keys(f).length || busy}
                onClick={() =>
                  execute(
                    () =>
                      api(
                        kind === "users"
                          ? "/users/" + r.id
                          : "/records/" + kind + "/" + r.id,
                        "PATCH",
                        f,
                      ),
                    "Changes saved",
                  )
                }
              >
                Save changes <Check size={16} />
              </Button>
            </div>
          )}
          {schema[kind] &&
            ![
              "assets",
              "tickets",
              "maintenance",
              "users",
              "knowledge",
              "layouts",
            ].includes(kind) &&
            write && (
              <div className="archive-row">
                <span>Archive this record instead of deleting it.</span>
                <button
                  className="text-btn"
                  onClick={() =>
                    execute(
                      () =>
                        api("/records/" + kind + "/" + r.id, "PATCH", {
                          status: "ARCHIVED",
                        }),
                      "Record archived",
                    )
                  }
                >
                  Archive record
                </button>
              </div>
            )}
        </>
      )}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
    </Modal>
  );
}
function RoleEditor({ record: r, data, run, onClose }) {
  const [p, setP] = useState(r.permissions),
    [error, setError] = useState("");
  return (
    <Modal
      title={r.name}
      subtitle="Choose the modules this role can manage."
      onClose={onClose}
    >
      <div className="permission-checkboxes">
        {data.permissions.map((k) => (
          <label key={k}>
            <input
              type="checkbox"
              disabled={r.name === "Administrator"}
              checked={p.includes(k)}
              onChange={(e) =>
                setP(e.target.checked ? [...p, k] : p.filter((x) => x !== k))
              }
            />
            {labels[k]}
          </label>
        ))}
      </div>
      {error && <div className="error">{error}</div>}
      <div className="modal-footer">
        <span>
          {r.name === "Administrator"
            ? "Protected administrator role"
            : "Self-service access is always included."}
        </span>
        <Button
          disabled={r.name === "Administrator"}
          onClick={() =>
            run(
              () => api("/roles/" + r.id, "PATCH", { permissions: p }),
              "Role permissions saved",
            )
              .then(onClose)
              .catch((e) => setError(e.message))
          }
        >
          Save permissions
        </Button>
      </div>
    </Modal>
  );
}
function SettingsPage({ data, run, onSetup }) {
  const [s, setS] = useState(data.tenant.settings),
    [error, setError] = useState("");
  return (
    <div className="settings-grid">
      <section className="card settings-form">
        <h3>Organization preferences</h3>
        <p className="muted">These settings apply across your workspace.</p>
        <div className="form-grid">
          <Field label="Organization" value={data.tenant.name} disabled />
          <Field label="Workspace ID" value={data.tenant.code} disabled />
          <Field
            label="Base currency"
            value={s.currency}
            onChange={(v) => setS({ ...s, currency: v })}
            options={["USD", "INR", "PGK", "EUR", "GBP", "AUD", "AED"]}
          />
          <Field
            label="Time zone"
            value={s.timezone}
            onChange={(v) => setS({ ...s, timezone: v })}
            options={[
              "UTC",
              "Asia/Kolkata",
              "Pacific/Port_Moresby",
              "Europe/London",
              "America/New_York",
              "Australia/Sydney",
            ]}
          />
        </div>
        {error && <div className="error">{error}</div>}
        <Button
          onClick={() =>
            run(
              () => api("/settings", "PATCH", s),
              "Workspace settings saved",
            ).catch((e) => setError(e.message))
          }
        >
          Save preferences <Check size={16} />
        </Button>
      </section>
      <section className="card settings-aside">
        <span className="kpi-icon">
          <Leaf size={23} />
        </span>
        <h3>
          {data.tenant.settings.live
            ? "You’re live. Keep growing."
            : "Ready when you are."}
        </h3>
        <p>
          Your setup checklist brings together the essentials for a smooth first
          day.
        </p>
        <Button secondary onClick={onSetup}>
          Open setup guide <ArrowRight size={15} />
        </Button>
        <div className="settings-plan">
          <span className="mini-label">CURRENT EDITION</span>
          <h3>{data.tenant.settings.edition}</h3>
          <p>Assets, helpdesk, maintenance, and automation.</p>
          <small>
            Edition is workspace metadata. Billing is not connected.
          </small>
        </div>
      </section>
      <section className="card integration-card">
        <h3>Integration readiness</h3>
        <div>
          {[
            ["AI model", "Optional · configure server credentials"],
            [
              "Email / SMS / WhatsApp",
              "Not connected · provider adapters required",
            ],
            ["Single sign-on & MFA", "Not connected"],
            ["Accounting / ERP", "Not connected · purchase workflows excluded"],
            ["Billing & subscriptions", "Not connected"],
          ].map(([n, status]) => (
            <div key={n}>
              <strong>{n}</strong>
              <span>{status}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
function Layouts({ data, run, setModal }) {
  const [selected, setSelected] = useState(""),
    [placing, setPlacing] = useState(""),
    [error, setError] = useState("");
  const plan = data.layouts.find((l) => l.id === selected) || data.layouts[0];
  const mappings = plan?.mappings || [];
  const assets = data.assets.filter(
    (a) => a.location_code === plan?.location_code,
  );
  return (
    <div className="card layouts-card">
      <div className="table-toolbar">
        <select
          aria-label="Select floor plan"
          value={plan?.id || ""}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Choose floor plan</option>
          {data.layouts.map((l) => (
            <option value={l.id} key={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        {plan && (
          <select
            aria-label="Select asset to place"
            value={placing}
            onChange={(e) => setPlacing(e.target.value)}
          >
            <option value="">Place an asset on this plan</option>
            {assets.map((a) => (
              <option value={a.id} key={a.id}>
                {a.name} · {a.code}
              </option>
            ))}
          </select>
        )}
      </div>
      {!plan ? (
        <Empty
          icon={Map}
          title="A different perspective on your assets."
          text="Upload a floor plan, choose a location, and place your assets on it."
          action={
            <Button
              small
              onClick={() => setModal({ type: "create", kind: "layouts" })}
            >
              <Plus size={15} /> Add floor plan
            </Button>
          }
        />
      ) : (
        <>
          <div
            className={"floor-plan " + (placing ? "placing" : "")}
            onClick={async (e) => {
              if (!placing) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const m = {
                asset_id: placing,
                x: ((e.clientX - rect.left) / rect.width) * 100,
                y: ((e.clientY - rect.top) / rect.height) * 100,
              };
              try {
                await run(
                  () =>
                    api("/records/layouts/" + plan.id, "PATCH", {
                      mappings: [
                        ...mappings.filter((x) => x.asset_id !== placing),
                        m,
                      ],
                    }),
                  "Asset placed on floor plan",
                );
                setPlacing("");
              } catch (e) {
                setError(e.message);
              }
            }}
          >
            {plan.image ? (
              <img src={plan.image} alt={plan.name} />
            ) : (
              <div className="floor-grid">
                <div>WORKSPACE</div>
                <div>MEETING ROOM</div>
                <div>STORE</div>
                <div>OPERATIONS</div>
              </div>
            )}
            {mappings.map((m) => {
              const a = data.assets.find((a) => a.id === m.asset_id);
              return (
                a && (
                  <button
                    key={m.asset_id}
                    className={
                      "map-pin " +
                      (["IN_REPAIR", "MAINTENANCE"].includes(a.status)
                        ? "alert"
                        : "")
                    }
                    aria-label={a.name + " · " + pretty(a.status)}
                    title={a.name + " · " + pretty(a.status)}
                    style={{ left: m.x + "%", top: m.y + "%" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setModal({ type: "detail", kind: "assets", record: a });
                    }}
                  >
                    <Boxes size={17} />
                    <span>{a.code}</span>
                  </button>
                )
              );
            })}
          </div>
          <div className="card-foot">
            <Map size={16} />
            {placing
              ? "Click anywhere on the plan to place the selected asset."
              : "Select an asset above to place it. Click a marker to open asset details."}
          </div>
        </>
      )}
      {error && <div className="error">{error}</div>}
    </div>
  );
}
function parseCSV(text) {
  const rows = [];
  let row = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (quoted) throw Error("Unclosed quote in CSV");
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  const headers = rows.shift()?.map((h) => h.trim().replace(/^\uFEFF/, ""));
  if (!headers || !headers.includes("name"))
    throw Error("CSV needs a name column");
  return rows.map((r, i) => {
    if (r.length !== headers.length)
      throw Error("Row " + (i + 2) + " has the wrong number of columns");
    return Object.fromEntries(headers.map((h, j) => [h, r[j].trim()]));
  });
}
function ImportAssets({ data, run, onClose }) {
  const [rows, setRows] = useState([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const template =
    "code,name,category_code,location_code,status,cost\nAST-001,Example laptop,CAT-IT," +
    (data.locations[0]?.code || "HQ") +
    ",IN_STOCK,1200\n";
  return (
    <Modal
      title="Bring your asset register along."
      subtitle="Import up to 500 assets. All rows are validated before anything is saved."
      wide
      onClose={onClose}
    >
      <div className="help-content">
        <p>
          Required columns: name, category_code, location_code. Optional columns
          include code, serial_number, cost, warranty_end, and next_due. Use
          master codes from this workspace and ISO dates (YYYY-MM-DD).
        </p>
        <button
          className="text-btn"
          onClick={() => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(
              new Blob([template], { type: "text/csv" }),
            );
            a.download = "assetq-import-template.csv";
            a.click();
            URL.revokeObjectURL(a.href);
          }}
        >
          Download CSV template <Download size={15} />
        </button>
      </div>
      <label className="field import-file">
        <span>Asset register (.csv)</span>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={async (e) => {
            try {
              const file = e.target.files[0];
              if (!file) return;
              if (file.size > 1000000)
                throw Error("Use a CSV smaller than 1 MB");
              const parsed = parseCSV(await file.text());
              setRows(parsed);
              setError("");
            } catch (e) {
              setError(e.message);
              setRows([]);
            }
          }}
        />
      </label>
      {rows.length > 0 && (
        <div className="import-preview">
          <h3>{rows.length} assets ready for review</h3>
          {rows.slice(0, 5).map((r, i) => (
            <div key={i}>
              {r.code || "Auto tag"} · {r.name} <span>{r.location_code}</span>
            </div>
          ))}
          {rows.length > 5 && <small>…and {rows.length - 5} more</small>}
        </div>
      )}
      {error && <div className="error">{error}</div>}
      <div className="modal-footer">
        <span>Duplicate tags or invalid codes reject the whole import.</span>
        <Button
          disabled={!rows.length || busy}
          onClick={async () => {
            setBusy(true);
            try {
              await run(
                () => api("/assets/import", "POST", { rows }),
                rows.length + " assets imported",
              );
              onClose();
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          Import assets <ArrowRight size={16} />
        </Button>
      </div>
    </Modal>
  );
}
function ThresholdEditor({ record: r, run, onClose }) {
  const [value, setValue] = useState(r.threshold),
    [error, setError] = useState("");
  return (
    <Modal
      title={r.name}
      subtitle="Tune this rule to your organization’s needs."
      onClose={onClose}
    >
      <Field
        label={
          r.event === "WarrantyExpiring"
            ? "Days before warranty expiry"
            : r.event === "SLAAtRisk"
              ? "Percent of SLA window elapsed"
              : "Number of active incidents"
        }
        type="number"
        min="1"
        value={value}
        onChange={setValue}
      />
      {error && <div className="error">{error}</div>}
      <div className="modal-footer">
        <span>Every rule change is audited.</span>
        <Button
          onClick={() =>
            run(
              () =>
                api("/rules/" + r.id, "PATCH", { threshold: Number(value) }),
              "Rule threshold updated",
            )
              .then(onClose)
              .catch((e) => setError(e.message))
          }
        >
          Save threshold
        </Button>
      </div>
    </Modal>
  );
}
function PasswordChange({ run }) {
  const [open, setOpen] = useState(false),
    [current, setCurrent] = useState(""),
    [next, setNext] = useState(""),
    [error, setError] = useState("");
  return (
    <div className="password-change">
      <button className="text-btn" onClick={() => setOpen(!open)}>
        <ShieldCheck size={14} /> Change your password
      </button>
      {open && (
        <>
          <Field
            label="Current password"
            type="password"
            value={current}
            onChange={setCurrent}
          />
          <Field
            label="New password"
            type="password"
            value={next}
            onChange={setNext}
          />
          {error && <div className="error">{error}</div>}
          <Button
            small
            disabled={next.length < 10 || !current}
            onClick={() =>
              run(
                () =>
                  api("/password", "POST", {
                    current_password: current,
                    new_password: next,
                  }),
                "Password changed; other sessions signed out",
              )
                .then(() => {
                  setOpen(false);
                  setCurrent("");
                  setNext("");
                })
                .catch((e) => setError(e.message))
            }
          >
            Update password
          </Button>
        </>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
