import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, Bot, CheckCircle2,
  CircleDollarSign, Clock3, CreditCard, Database, Eye, EyeOff,
  FlaskConical, Gauge, LayoutDashboard, Link2, LogOut, Menu, Network,
  Play, RefreshCw, Search, ShieldCheck, SlidersHorizontal, Sparkles,
  UserPlus, Users, Webhook, X, Zap
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, CartesianGrid, Cell, LineChart, Line,
  PieChart, Pie, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { actions, cases, customers, failureMix, revenueTrend } from "./data";

const money = (n) => `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const chartColors = ["#6257F5", "#16B889", "#F59E0B", "#3B82F6", "#EC4899", "#8B5CF6"];

function App() {
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem("recoverai_auth") === "true");
  const [authMode, setAuthMode] = useState("login");
  const [page, setPage] = useState("Dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [action, setAction] = useState("All actions");
  const [toast, setToast] = useState("");

  // Live dashboard data
  const [dashboardStats, setDashboardStats] = useState(null);
  const [dashboardError, setDashboardError] = useState("");

  // Live recovery cases data
  const [liveCases, setLiveCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [casesError, setCasesError] = useState("");

  // Live customer data
  const [liveCustomers, setLiveCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState("");

  // Live webhook event data
  const [liveWebhookEvents, setLiveWebhookEvents] = useState([]);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookError, setWebhookError] = useState("");

  const nav = [
    ["Dashboard", LayoutDashboard],
    ["Recovery Cases", Activity],
    ["Batch Evaluation", FlaskConical],
    ["Customers", Users],
    ["Webhook Events", Webhook],
    ["Policy & Settings", SlidersHorizontal]
  ];

  const showToast = (text) => {
    setToast(text);
    setTimeout(() => setToast(""), 2500);
  };

  const logout = () => {
    localStorage.removeItem("recoverai_auth");
    setAuthenticated(false);
  };

  useEffect(() => {
    if (!authenticated || page !== "Dashboard") return;

    const fetchDashboardStats = async () => {
      try {
        setDashboardError("");

        const response = await fetch(
          "http://localhost:5000/api/dashboard/stats"
        );

        if (!response.ok) {
          throw new Error(
            `Dashboard API returned ${response.status}`
          );
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(
            result.message || "Failed to load dashboard stats"
          );
        }

        setDashboardStats(result.data);

      } catch (error) {
        console.error("Dashboard API Error:", error);

        setDashboardError(
          error.message || "Unable to load dashboard data"
        );
      }
    };

    fetchDashboardStats();
  }, [authenticated, page]);


  useEffect(() => {
    if (!authenticated || page !== "Recovery Cases") return;

    const fetchRecoveryCases = async () => {
      try {
        setCasesLoading(true);
        setCasesError("");

        const response = await fetch(
          "http://localhost:5000/api/recovery/cases"
        );

        if (!response.ok) {
          throw new Error(
            `Recovery Cases API returned ${response.status}`
          );
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(
            result.message || "Failed to load recovery cases"
          );
        }

        // Convert MongoDB fields to the field names
        // already expected by the existing UI.
        const normalizedCases = (result.data || []).map((item) => ({
          id: item.caseId || item.transactionId || "Unknown",
          transactionId: item.transactionId || "",
          customer: item.customerId || "Unknown",
          risk: Number(item.amount || 0),

          probability:
            typeof item.recoveryProbability === "number"
              ? item.recoveryProbability * 100
              : 0,

          action:
            item.recommendedAction || "unknown",

          status:
            item.status || "open",

          reason:
            item.failureReason || "unknown",

          recovered:
            Number(item.recoveredAmount || 0),

          time:
            item.recoveryTimeMinutes
              ? `${item.recoveryTimeMinutes} min`
              : "—",

          recoveredAmount:
            Number(item.recoveredAmount || 0),

          recoveryTimeMinutes:
            Number(item.recoveryTimeMinutes || 0),

          createdAt:
            item.createdAt,

          updatedAt:
            item.updatedAt
        }));

        setLiveCases(normalizedCases);

      } catch (error) {
        console.error(
          "Recovery Cases API Error:",
          error
        );

        setCasesError(
          error.message ||
          "Unable to load recovery cases"
        );

      } finally {
        setCasesLoading(false);
      }
    };

    fetchRecoveryCases();
  }, [authenticated, page]);


  useEffect(() => {
    if (!authenticated || page !== "Customers") return;

    const fetchCustomers = async () => {
      try {
        setCustomersLoading(true);
        setCustomersError("");

        const response = await fetch(
          "http://localhost:5000/api/customers"
        );

        if (!response.ok) {
          throw new Error(
            `Customers API returned ${response.status}`
          );
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(
            result.message || "Failed to load customers"
          );
        }

        setLiveCustomers(result.data || []);
      } catch (error) {
        console.error("Customers API Error:", error);
        setCustomersError(
          error.message || "Unable to load customer data"
        );
      } finally {
        setCustomersLoading(false);
      }
    };

    fetchCustomers();
  }, [authenticated, page]);


  useEffect(() => {
    if (!authenticated || page !== "Webhook Events") return;

    const fetchWebhookEvents = async () => {
      try {
        setWebhookLoading(true);
        setWebhookError("");

        const response = await fetch(
          "http://localhost:5000/api/webhooks/events"
        );

        if (!response.ok) {
          throw new Error(
            `Webhook Events API returned ${response.status}`
          );
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(
            result.message || "Failed to load webhook events"
          );
        }

        setLiveWebhookEvents(result.data || []);
      } catch (error) {
        console.error("Webhook Events API Error:", error);
        setWebhookError(
          error.message || "Unable to load webhook events"
        );
      } finally {
        setWebhookLoading(false);
      }
    };

    fetchWebhookEvents();
  }, [authenticated, page]);


  const casesSource =
    liveCases.length > 0
      ? liveCases
      : cases;

  const filteredCases = useMemo(() => casesSource.filter(c => {
    const q = query.toLowerCase();

    return (
      !q ||
      c.id.toLowerCase().includes(q) ||
      c.customer.toLowerCase().includes(q)
    )
      &&
      (status === "All statuses" ||
        c.status === status)
      &&
      (action === "All actions" ||
        c.action === action);

  }), [
    casesSource,
    query,
    status,
    action
  ]);


  if (!authenticated) {
    return <AuthPage mode={authMode} setMode={setAuthMode} onLogin={() => {
      localStorage.setItem("recoverai_auth", "true");
      setAuthenticated(true);
    }} />;
  }

  return <div className="app">
    <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="brand">
        <div className="brandMark"><Activity size={22} /></div>
        <div><strong>RecoverAI</strong><span>Revenue Recovery Agent</span></div>
        <button className="mobileClose" onClick={() => setMobileOpen(false)}><X size={19} /></button>
      </div>

      <div className="agentCard">
        <span className="pulse"></span>
        <div><b>AI Agent Online</b><small>Policy engine active</small></div>
      </div>

      <nav>
        {nav.map(([label, Icon]) =>
          <button
            key={label}
            className={page === label ? "active" : ""}
            onClick={() => {
              setPage(label);
              setMobileOpen(false);
            }}
          >
            <Icon size={19} /><span>{label}</span>
          </button>
        )}
      </nav>

      <div className="sidebarBottom">
        <div className="modelBadge">
          <Bot size={19} />
          <div>
            <b>Random Forest</b>
            <span>v1.0 · 81.57% accuracy</span>
          </div>
        </div>

        <div className="miniStatus">
          <span></span> Razorpay Test Mode
        </div>

        <button className="logoutBtn" onClick={logout}>
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>

    <main className="main">
      <header className="topbar">
        <button
          className="menuBtn"
          onClick={() => setMobileOpen(true)}
        >
          <Menu />
        </button>

        <div>
          <div className="crumb">
            RECOVERY INTELLIGENCE / {page.toUpperCase()}
          </div>
          <h1>{page}</h1>
        </div>

        <div className="topActions">
          <button className="iconBtn">
            <Bell size={19} />
            <i></i>
          </button>

          <div className="topAgent">
            <span className="pulse"></span>
            AI Agent Online
          </div>

          <div className="avatar">PM</div>
        </div>
      </header>

      {page === "Dashboard" &&
        <Dashboard
  onToast={showToast}
  dashboardStats={dashboardStats}
  dashboardError={dashboardError}
  liveCases={liveCases}
/>
      }

      {page === "Recovery Cases" &&
        <CasesPage
          filteredCases={filteredCases}
          query={query}
          setQuery={setQuery}
          status={status}
          setStatus={setStatus}
          action={action}
          setAction={setAction}
          casesLoading={casesLoading}
          casesError={casesError}
        />
      }

      {page === "Batch Evaluation" &&
        <BatchPage onToast={showToast} />
      }

      {page === "Customers" &&
        <CustomersPage
          liveCustomers={liveCustomers}
          customersLoading={customersLoading}
          customersError={customersError}
        />
      }

      {page === "Webhook Events" &&
        <WebhookPage
          liveWebhookEvents={liveWebhookEvents}
          webhookLoading={webhookLoading}
          webhookError={webhookError}
        />
      }

      {page === "Policy & Settings" &&
        <PolicyPage onToast={showToast} />
      }
    </main>

    {toast &&
      <div className="toast">
        <CheckCircle2 size={19} />
        {toast}
      </div>
    }
  </div>;
}


function AuthPage({ mode, setMode, onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e) => {
    e.preventDefault();
    onLogin();
  };

  return <div className="authPage">
    <div className="authGlow authGlowOne"></div>
    <div className="authGlow authGlowTwo"></div>

    <div className="authShell">

      <div className="authBrand">
        <div className="authLogo">
          <Activity size={27} />
        </div>

        <div>
          <strong>RecoverAI</strong>
          <span>Intelligent Revenue Recovery</span>
        </div>
      </div>

      <div className="authGrid">

        <div className="authHero">
          <div className="eyebrow">
            <Sparkles size={15} />
            AUTONOMOUS RECOVERY PLATFORM
          </div>

          <h1>
            Turn failed payments into
            <em> recovered revenue.</em>
          </h1>

          <p>
            Detect payment risk, diagnose failures, choose a bounded
            intervention and verify the outcome — all from one
            intelligent control center.
          </p>

          <div className="authProofGrid">
            <div>
              <b>81.57%</b>
              <span>Model accuracy</span>
            </div>

            <div>
              <b>₹15K</b>
              <span>Live recovery verified</span>
            </div>

            <div>
              <b>HMAC</b>
              <span>Webhook verified</span>
            </div>
          </div>

          <div className="authFlow">
            <span>Detect</span>
            <i>→</i>
            <span>Diagnose</span>
            <i>→</i>
            <span>Decide</span>
            <i>→</i>
            <span>Recover</span>
          </div>
        </div>

        <div className="authCard">

          <div className="authTabs">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => setMode("login")}
            >
              Login
            </button>

            <button
              className={mode === "register" ? "active" : ""}
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>

          <div className="authTitle">
            <div className="authMiniIcon">
              {mode === "login"
                ? <Activity size={20} />
                : <UserPlus size={20} />
              }
            </div>

            <div>
              <h2>
                {mode === "login"
                  ? "Welcome back"
                  : "Create your account"
                }
              </h2>

              <p>
                {mode === "login"
                  ? "Access your recovery intelligence dashboard."
                  : "Set up your RecoverAI workspace."
                }
              </p>
            </div>
          </div>

          <form onSubmit={submit}>

            {mode === "register" &&
              <label>
                Full name
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </label>
            }

            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Password

              <div className="passwordField">

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={4}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword
                    ? <EyeOff size={18} />
                    : <Eye size={18} />
                  }
                </button>

              </div>
            </label>

            {mode === "register" &&
              <label>
                Confirm password
                <input
                  type="password"
                  placeholder="Re-enter password"
                  required
                  minLength={4}
                />
              </label>
            }

            <button
              className="authSubmit"
              type="submit"
            >
              {mode === "login"
                ? "Sign in to RecoverAI"
                : "Create account"
              }

              <ArrowUpRight size={18} />
            </button>

          </form>

          <div className="authNote">
            <ShieldCheck size={15} />
            Demo access · credentials are stored locally for this UI preview.
          </div>

        </div>
      </div>

      <div className="authFooter">
        RecoverAI · Razorpay Test Mode · AI-powered revenue recovery
      </div>

    </div>
  </div>;
}


function StatCard({ icon: Icon, label, value, sub, trend, type }) {
  return <div className={`statCard ${type || ""}`}>

    <div className="statTop">

      <div className="statIcon">
        <Icon size={20} />
      </div>

      <span className={trend > 0 ? "up" : "neutral"}>
        {trend > 0
          ? <ArrowUpRight size={15} />
          : <ArrowDownRight size={15} />
        }

        {Math.abs(trend || 0)}%
      </span>

    </div>

    <div className="statLabel">
      {label}
    </div>

    <div className="statValue">
      {value}
    </div>

    <div className="statSub">
      {sub}
    </div>

  </div>;
}


function Panel({ title, sub, children, action }) {
  return <section className="panel">

    <div className="panelHead">

      <div>
        <h3>{title}</h3>
        {sub && <p>{sub}</p>}
      </div>

      {action}

    </div>

    {children}

  </section>;
}


function Dashboard({
  onToast,
  dashboardStats,
  dashboardError,
  liveCases
}) {

  // Keep original UI fallback values.
  const totalRisk =
    dashboardStats?.totalRevenueAtRisk ?? 217065.11;

  const recovered =
    dashboardStats?.recoveredRevenue ?? 72988.31;

  const recoveryRate =
    dashboardStats?.recoveryRate ?? 40.0;

  const averageRecoveryTime =
    dashboardStats?.averageRecoveryTime ?? 32;

  return <div className="content">

    <div className="hero">

      <div>
        <div className="eyebrow">
          <Sparkles size={15} />
          AUTONOMOUS RECOVERY CONTROL CENTER
        </div>

        <h2>
          Recover revenue before it becomes
          <em>lost revenue.</em>
        </h2>

        <p>
          Detect → Diagnose → Decide → Execute → Verify.
          Every action is policy-bounded and fully auditable.
        </p>
      </div>

      <button
        className="primary"
        onClick={() =>
          onToast("Live recovery pipeline is ready")
        }
      >
        <Zap size={18} />
        Run live recovery
      </button>

    </div>


    <div className="statsGrid">

      <StatCard
        icon={CircleDollarSign}
        label="Revenue at risk"
        value={money(totalRisk)}
        sub={
          dashboardStats
            ? `Across ${dashboardStats.totalCases} recovery cases`
            : "Across 10 active evaluation cases"
        }
        trend={12.8}
      />

      <StatCard
        icon={CheckCircle2}
        label="Recovered revenue"
        value={money(recovered)}
        sub="₹15,000 recovered live via Razorpay"
        trend={18.4}
        type="green"
      />

      <StatCard
        icon={Gauge}
        label="Recovery rate"
        value={`${Number(recoveryRate).toFixed(1)}%`}
        sub={
          dashboardStats
            ? `${dashboardStats.recoveredCases} recovered · ${dashboardStats.failedCases} failed · ${dashboardStats.escalatedCases} escalated`
            : "4 recovered · 2 failed · 4 escalated"
        }
        trend={6.2}
        type="purple"
      />

      <StatCard
        icon={Clock3}
        label="Avg recovery time"
        value={`${Number(averageRecoveryTime).toFixed(0)} min`}
        sub="Policy-approved interventions"
        trend={9.5}
        type="orange"
      />

    </div>


    <div className="grid2">

      <Panel
        title="Revenue recovery trajectory"
        sub="At-risk revenue vs successfully recovered revenue — last 7 days"
        action={
          <span className="legend">
            <i className="riskDot"></i>
            At risk
            <i className="recDot"></i>
            Recovered
          </span>
        }
      >

        <div className="chart large">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <AreaChart data={revenueTrend}>

              <defs>

                <linearGradient
                  id="riskFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#6257F5"
                    stopOpacity=".25"
                  />

                  <stop
                    offset="100%"
                    stopColor="#6257F5"
                    stopOpacity="0"
                  />
                </linearGradient>

                <linearGradient
                  id="recFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#16B889"
                    stopOpacity=".22"
                  />

                  <stop
                    offset="100%"
                    stopColor="#16B889"
                    stopOpacity="0"
                  />
                </linearGradient>

              </defs>

              <CartesianGrid
                stroke="#edf0f6"
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 12,
                  fill: "#7d8799"
                }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 12,
                  fill: "#7d8799"
                }}
              />

              <Tooltip
                formatter={(v) => `₹${v}k`}
              />

              <Area
                type="monotone"
                dataKey="risk"
                stroke="#6257F5"
                strokeWidth={3}
                fill="url(#riskFill)"
                name="At risk"
              />

              <Area
                type="monotone"
                dataKey="recovered"
                stroke="#16B889"
                strokeWidth={3}
                fill="url(#recFill)"
                name="Recovered"
              />

            </AreaChart>

          </ResponsiveContainer>

        </div>

      </Panel>


      <Panel
        title="Agent action mix"
        sub="Interventions selected by the recovery agent"
      >

        <div className="chart">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <BarChart
              data={actions}
              layout="vertical"
              margin={{
                left: 20,
                right: 20
              }}
            >

              <CartesianGrid
                stroke="#edf0f6"
                strokeDasharray="3 3"
                horizontal={false}
              />

              <XAxis
                type="number"
                hide
              />

              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 12,
                  fill: "#657087"
                }}
              />

              <Tooltip />

              <Bar
                dataKey="value"
                radius={[0, 9, 9, 0]}
              >

                {actions.map((_, i) =>
                  <Cell
                    key={i}
                    fill={chartColors[i]}
                  />
                )}

              </Bar>

            </BarChart>

          </ResponsiveContainer>

        </div>

      </Panel>

    </div>


    <div className="grid3">

      <Panel
        title="Recovery probability distribution"
        sub="Model confidence across current cases"
      >

        <div className="probBars">

          {[
            ["High · >75%", 58, "#16B889"],
            ["Medium · 45–75%", 27, "#6257F5"],
            ["Low · <45%", 15, "#F59E0B"]
          ].map(([x, v, color]) =>

            <div
              className="probRow"
              key={x}
            >

              <div>
                <span>{x}</span>
                <b>{v}%</b>
              </div>

              <div className="bar">
                <i
                  style={{
                    width: `${v}%`,
                    background: color
                  }}
                />
              </div>

            </div>

          )}

        </div>

      </Panel>


      <Panel
        title="Failure reason mix"
        sub="What is putting revenue at risk?"
      >

        <div className="chart donut">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <PieChart>

              <Pie
                data={failureMix}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={86}
                paddingAngle={3}
              >

                {failureMix.map((_, i) =>
                  <Cell
                    key={i}
                    fill={chartColors[i]}
                  />
                )}

              </Pie>

              <Tooltip />

            </PieChart>

          </ResponsiveContainer>

          <div className="donutCenter">
            <b>6</b>
            <span>reasons</span>
          </div>

        </div>

      </Panel>


      <Panel
        title="Live recovery signal"
        sub="Latest verified payment event"
      >

        <div className="liveCard">

          <div className="liveIcon">
            <CheckCircle2 />
          </div>

          <div>
            <b>₹15,000 recovered</b>
            <span>TXN-WEBHOOK-20260903-001</span>
            <small>
              payment_link.paid · 2 min recovery time
            </small>
          </div>

        </div>

        <div className="signal">
          <span>Webhook</span>
          <b>Verified</b>
          <span>Policy</span>
          <b>Allowed</b>
        </div>

      </Panel>

    </div>


    <Panel
      title="Latest recovery cases"
      sub="Real-time view of the agent's most recent decisions"
      action={
        <button className="textBtn">
          View all
          <ArrowUpRight size={16} />
        </button>
      }
    >

      <CaseTable
        rows={
          liveCases.length > 0
            ? liveCases.slice(0, 6)
            : cases.slice(0, 6)
        }
      />

    </Panel>

  </div>;
}


function CasesPage({
  filteredCases,
  query,
  setQuery,
  status,
  setStatus,
  action,
  setAction,
  casesLoading,
  casesError
}) {

  return <div className="content">

    <div className="pageIntro">

      <div>
        <h2>Recovery Cases</h2>
        <p>
          Every at-risk event, AI diagnosis, policy decision and outcome.
        </p>
      </div>

      <div className="pill success">
        <span className="pulse"></span>
        Agent healthy
      </div>

    </div>


    <div className="toolbar">

      <div className="search">

        <Search size={19} />

        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search transaction / customer"
        />

      </div>


      <select
        value={status}
        onChange={e => setStatus(e.target.value)}
      >
        <option>All statuses</option>
        <option>recovered</option>
        <option>failed</option>
        <option>escalated</option>
        <option>stopped</option>
      </select>


      <select
        value={action}
        onChange={e => setAction(e.target.value)}
      >
        <option>All actions</option>
        <option>Payment Link</option>
        <option>Reminder</option>
        <option>Escalate</option>
      </select>

    </div>


    <Panel
      title={`${filteredCases.length} recovery cases`}
      sub={
        casesLoading
          ? "Loading live recovery cases..."
          : "Sorted by latest activity"
      }
    >

      <CaseTable
        rows={filteredCases}
      />

    </Panel>

  </div>;
}


function CaseTable({ rows }) {

  return <div className="tableWrap">

    <table>

      <thead>

        <tr>
          <th>Transaction</th>
          <th>Customer</th>
          <th>Revenue at Risk</th>
          <th>P(recovery)</th>
          <th>AI Action</th>
          <th>Status</th>
          <th>Recovered</th>
          <th>When</th>
        </tr>

      </thead>


      <tbody>

        {rows.map(c =>

          <tr key={c.id}>

            <td>
              <b>{c.id}</b>
              <small>{c.reason}</small>
            </td>

            <td>
              {c.customer}
            </td>

            <td>
              <b>
                {money(c.risk)}
              </b>
            </td>

            <td>
              <span className="prob">
                {Number(c.probability || 0).toFixed(1)}%
              </span>
            </td>

            <td>
              {c.action}
            </td>

            <td>
              <span className={`status ${c.status}`}>
                {c.status}
              </span>
            </td>

            <td
              className={
                c.recovered
                  ? "recoveredText"
                  : ""
              }
            >
              {c.recovered
                ? money(c.recovered)
                : "—"
              }
            </td>

            <td>
              {c.time}
            </td>

          </tr>

        )}

      </tbody>

    </table>

  </div>;
}


function BatchPage({ onToast }) {

  return <div className="content">

    <div className="pageIntro">

      <div>

        <div className="eyebrow">
          <FlaskConical size={15} />
          EVALUATION LAB
        </div>

        <h2>Batch Evaluation</h2>

        <p>
          Run synthetic at-risk cases through ML scoring,
          AI diagnosis, policy gates and bounded actions.
        </p>

      </div>

      <button
        className="primary"
        onClick={() =>
          onToast("Batch evaluation started · 10 cases")
        }
      >
        <Play size={17} />
        Run Batch
      </button>

    </div>


    <div className="statsGrid">

      <StatCard
        icon={CircleDollarSign}
        label="Total revenue at risk"
        value="₹2,17,065.11"
        sub="10 cases"
      />

      <StatCard
        icon={CheckCircle2}
        label="Recovered revenue"
        value="₹72,988.31"
        sub="4 recovered"
        type="green"
      />

      <StatCard
        icon={Gauge}
        label="Recovery rate"
        value="40.0%"
        sub="2 failed · 4 escalated"
        type="purple"
      />

      <StatCard
        icon={Clock3}
        label="Avg recovery time"
        value="32 min"
        sub="4 policy denials"
        type="orange"
      />

    </div>


    <Panel
      title="Actions selected by the agent"
      sub="Distribution across the latest evaluation run"
    >

      <div className="chart tall">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <BarChart data={actions}>

            <CartesianGrid
              stroke="#edf0f6"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 12,
                fill: "#657087"
              }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 12,
                fill: "#7d8799"
              }}
            />

            <Tooltip />

            <Bar
              dataKey="value"
              radius={[9, 9, 0, 0]}
            >

              {actions.map((_, i) =>
                <Cell
                  key={i}
                  fill={chartColors[i]}
                />
              )}

            </Bar>

          </BarChart>

        </ResponsiveContainer>

      </div>

    </Panel>


    <div className="grid2">

      <Panel
        title="Batch execution pipeline"
        sub="Every case follows the same bounded path"
      >

        <div className="pipeline">

          {[
            "Revenue event",
            "ML score",
            "AI diagnosis",
            "Policy gate",
            "Action",
            "Outcome"
          ].map((x, i) =>

            <React.Fragment key={x}>

              <div className="pipe">

                <span>{i + 1}</span>

                <b>{x}</b>

                <small>
                  {
                    [
                      "detected",
                      "87.36%",
                      "network_error",
                      "ALLOW",
                      "payment_link",
                      "₹15,000 recovered"
                    ][i]
                  }
                </small>

              </div>

              {i < 5 &&
                <div className="arrow">
                  →
                </div>
              }

            </React.Fragment>

          )}

        </div>

      </Panel>


      <Panel
        title="Demo run"
        sub="A concise script for your final presentation"
      >

        <div className="script">

          <p>
            <b>1.</b> Inject failed ₹15,000 payment.
          </p>

          <p>
            <b>2.</b> Random Forest predicts
            <strong> 87.36%</strong>.
          </p>

          <p>
            <b>3.</b> Agent chooses Payment Link.
          </p>

          <p>
            <b>4.</b> Policy engine returns
            <strong> ALLOW</strong>.
          </p>

          <p>
            <b>5.</b> Razorpay payment succeeds.
          </p>

          <p>
            <b>6.</b> Webhook verifies and marks
            <strong> ₹15,000 recovered</strong>.
          </p>

        </div>

      </Panel>

    </div>

  </div>;
}


function CustomersPage({
  liveCustomers,
  customersLoading,
  customersError
}) {
  const customerRows =
    liveCustomers.length > 0
      ? liveCustomers.map(c => [
          c.customerId || "Unknown",
          "—",
          c.recoveredCases || 0,
          c.failedCases || 0,
          c.totalCases > 0
            ? c.totalRevenueAtRisk / c.totalCases
            : 0,
          c.recoveredRevenue || 0,
          `${Number(c.averageRecoveryProbability || 0).toFixed(1)}%`,
          c.latestStatus || "unknown"
        ])
      : customers;

  return <div className="content">

    <div className="pageIntro">

      <div>
        <h2>Customer Profiles</h2>

        <p>
          RFM, lifetime value and payment behavior
          context used by the recovery model.
        </p>
      </div>

      <div className="search compact">
        <Search size={18} />
        <input placeholder="Find customer" />
      </div>

    </div>


    <Panel
      title="Customer intelligence"
      sub={`${customerRows.length} profiles · sorted by lifetime value`}
    >

      {customersLoading && (
        <div className="emptyNote">
          Loading live customer data...
        </div>
      )}

      {customersError && (
        <div className="emptyNote">
          {customersError} · Showing existing customer data.
        </div>
      )}

      <div className="tableWrap">

        <table>

          <thead>

            <tr>
              <th>Customer</th>
              <th>Tenure</th>
              <th>Successes</th>
              <th>Failures</th>
              <th>Avg Txn</th>
              <th>Lifetime Value</th>
              <th>RFM</th>
              <th>Subscription</th>
            </tr>

          </thead>


          <tbody>

            {customerRows.map(c =>

              <tr key={c[0]}>
                <td>
                  <b>{c[0]}</b>
                </td>

                <td>
                  {c[1] === "—" ? "—" : `${c[1]} mo`}
                </td>

                <td className="greenText">
                  {c[2]}
                </td>

                <td className="redText">
                  {c[3]}
                </td>

                <td>
                  {money(c[4])}
                </td>

                <td>
                  <b>{money(c[5])}</b>
                </td>

                <td>
                  {c[6]}
                </td>

                <td>
                  <span
                    className={`subscription ${c[7]}`}
                  >
                    {c[7]}
                  </span>
                </td>

              </tr>
            )}

          </tbody>

        </table>

      </div>

    </Panel>

  </div>;
}


function WebhookPage({
  liveWebhookEvents,
  webhookLoading,
  webhookError
}) {
  const latestEvent = liveWebhookEvents[0] || null;

  const eventName = latestEvent?.event || "payment_link.paid";
  const paymentId =
    latestEvent?.paymentId || "No payment ID recorded";
  const caseId = latestEvent?.caseId || "No recovery case linked";
  const amount = Number(latestEvent?.amount || 0);
  const eventStatus = latestEvent?.status || "processed";
  const signatureVerified =
    latestEvent?.signatureVerified !== false;

  return <div className="content">

    <div className="pageIntro">

      <div>

        <h2>Webhook Events</h2>

        <p>
          Razorpay event stream with signature verification,
          persistence and idempotency.
        </p>

      </div>

      <div className="pill success">
        <span className="pulse"></span>
        Receiver online
      </div>

    </div>


    <div className="webhookBanner">

      <Webhook />

      <div>

        <b>Razorpay Webhook Receiver</b>

        <p>
          POST /api/webhooks/razorpay ·
          HMAC-SHA256 signature verification enabled.
        </p>

      </div>

    </div>


    <Panel
      title="Event stream"
      sub="Verified events are persisted against recovery cases"
    >

      {webhookLoading && (
        <div className="emptyNote">
          Loading webhook events...
        </div>
      )}

      {webhookError && (
        <div className="emptyNote">
          {webhookError}
        </div>
      )}

      {!webhookLoading && !webhookError && (
        <>
          <div className="eventHero">

            <div className="eventIcon">
              <CheckCircle2 />
            </div>

            <div>

              <b>{eventName}</b>

              <span>
                Latest event · {paymentId}
              </span>

              <small>
                {amount > 0
                  ? `Recovery event · ${money(amount)} · ${caseId}`
                  : `Event received · ${caseId}`
                }
              </small>

            </div>

            <span className={`status ${eventStatus === "processed" ? "recovered" : eventStatus}`}>
              {eventStatus}
            </span>

          </div>


          <div className="webhookExplanation">

            <div>

              <b>What this page does</b>

              <p>
                It proves that Razorpay sent the event to RecoverAI,
                the signature was verified, and the event was persisted
                against the recovery case in MongoDB.
              </p>

            </div>


            <div className="webhookChecks">

              <span>{signatureVerified ? "✓" : "✗"} Signature verified</span>
              <span>✓ Event received</span>
              <span>{caseId !== "No recovery case linked" ? "✓" : "—"} Case linked</span>
              <span>{eventStatus === "processed" ? "✓" : "—"} Event processed</span>

            </div>

          </div>


          <div className="emptyNote">
            {liveWebhookEvents.length > 0
              ? `${liveWebhookEvents.length} webhook event${liveWebhookEvents.length === 1 ? "" : "s"} recorded in MongoDB.`
              : "No webhook events recorded yet. Complete a Razorpay Test Mode payment to generate one."
            }
          </div>
        </>
      )}

    </Panel>

  </div>;
}

function PolicyPage({ onToast }) {

  const [max, setMax] = useState(3);
  const [threshold, setThreshold] = useState(50000);
  const [prob, setProb] = useState(.45);

  return <div className="content">

    <div className="pageIntro">

      <div>

        <h2>Policy & Settings</h2>

        <p>
          Safety gates, recovery limits and integration status.
        </p>

      </div>

      <button
        className="secondary"
        onClick={() =>
          onToast("Policy configuration saved")
        }
      >
        <ShieldCheck size={17} />
        Save policies
      </button>

    </div>


    <div className="policyIntro">

      <ShieldCheck size={22} />

      <div>

        <b>
          The safety layer controls the AI.
        </b>

        <span>
          The AI agent can recommend an action,
          but these deterministic rules decide
          whether it is allowed to execute.
        </span>

      </div>

    </div>


    <div className="grid2">

      <Panel
        title="Recovery safety policy"
        sub="Deterministic rules always override the agent"
      >

        <div className="settings">

          <label>
            Maximum recovery attempts

            <input
              type="number"
              value={max}
              onChange={e =>
                setMax(e.target.value)
              }
            />

          </label>


          <label>
            High-value review threshold (₹)

            <input
              type="number"
              value={threshold}
              onChange={e =>
                setThreshold(e.target.value)
              }
            />

          </label>


          <label>
            Minimum recovery probability

            <input
              type="number"
              step=".01"
              value={prob}
              onChange={e =>
                setProb(e.target.value)
              }
            />

          </label>


          <div className="rule">

            <ShieldCheck />

            <div>

              <b>
                High-value human review
              </b>

              <span>
                Transactions above ₹
                {Number(threshold).toLocaleString("en-IN")}
                cannot be auto-recovered.
              </span>

            </div>

            <strong>ON</strong>

          </div>


          <div className="rule">

            <RefreshCw />

            <div>

              <b>
                Duplicate-action protection
              </b>

              <span>
                Already recovered cases cannot receive
                another intervention.
              </span>

            </div>

            <strong>ON</strong>

          </div>


          <div className="rule">

            <X />

            <div>

              <b>
                Refund / payout actions
              </b>

              <span>
                Excluded from the allowed action set.
              </span>

            </div>

            <strong>BLOCKED</strong>

          </div>

        </div>

      </Panel>


      <Panel
        title="Integration health"
        sub="Live environment signals"
      >

        <div className="health">

          <HealthRow
            icon={Network}
            title="Node / Express API"
            detail="localhost:5000"
            ok
          />

          <HealthRow
            icon={Bot}
            title="ML service"
            detail="Random Forest · localhost:8000"
            ok
          />

          <HealthRow
            icon={Database}
            title="MongoDB"
            detail="recoverai database"
            ok
          />

          <HealthRow
            icon={CreditCard}
            title="Razorpay Test Mode"
            detail="Payment Links + webhooks"
            ok
          />

          <HealthRow
            icon={Webhook}
            title="zrok public webhook"
            detail="Public receiver active"
            ok
          />

        </div>

      </Panel>

    </div>


    <div className="integrationNote">

      <Sparkles />

      <div>

        <b>
          Live proof completed
        </b>

        <span>
          RC-1788452119682 · ₹15,000 recovered ·
          webhook verified · 2 min recovery time.
        </span>

      </div>

      <span className="status recovered">
        VERIFIED
      </span>

    </div>

  </div>;
}


function HealthRow({
  icon: Icon,
  title,
  detail,
  ok
}) {

  return <div className="healthRow">

    <div className="healthIcon">
      <Icon size={18} />
    </div>

    <div>
      <b>{title}</b>
      <span>{detail}</span>
    </div>

    <span className="healthDot">
      {ok ? "Healthy" : "Down"}
    </span>

  </div>;
}


export default App;