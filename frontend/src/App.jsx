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
const API_URL = import.meta.env.VITE_API_URL;
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

  // UI-driven live recovery case creation
  const [showRecoveryForm, setShowRecoveryForm] = useState(false);
  const [recoverySubmitting, setRecoverySubmitting] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState(null);
  const [recoveryForm, setRecoveryForm] = useState({
    transactionId: "",
    customerId: "",
    amount: 15000,
    currency: "INR",
    paymentMethod: "netbanking",
    failureReason: "network_error",
    attemptNumber: 1,
    previousSuccessCount: 5,
    previousFailureCount: 1,
    averageTransactionAmount: 12000,
    customerLifetimeValue: 85000,
    daysSinceLastPurchase: 10,
    purchaseFrequency: 4,
    subscriptionStatus: "active",
    deviceType: "mobile",
    country: "IN",
    hour: new Date().getHours(),
    dayOfWeek: new Date().getDay()
  });

  const openRecoveryForm = () => {
    const now = new Date();

    setRecoveryResult(null);
    setRecoveryForm({
      transactionId: `TXN-UI-${Date.now()}`,
      customerId: `CUST-UI-${Date.now()}`,
      amount: 15000,
      currency: "INR",
      paymentMethod: "netbanking",
      failureReason: "network_error",
      attemptNumber: 1,
      previousSuccessCount: 5,
      previousFailureCount: 1,
      averageTransactionAmount: 12000,
      customerLifetimeValue: 85000,
      daysSinceLastPurchase: 10,
      purchaseFrequency: 4,
      subscriptionStatus: "active",
      deviceType: "mobile",
      country: "IN",
      hour: now.getHours(),
      dayOfWeek: now.getDay()
    });
    setShowRecoveryForm(true);
  };

  const submitRecoveryCase = async (e) => {
    e.preventDefault();

    try {
      setRecoverySubmitting(true);
      setRecoveryResult(null);

      const response = await fetch(
        `${API_URL}/api/recovery/test`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...recoveryForm,
            amount: Number(recoveryForm.amount),
            attemptNumber: Number(recoveryForm.attemptNumber),
            previousSuccessCount: Number(recoveryForm.previousSuccessCount),
            previousFailureCount: Number(recoveryForm.previousFailureCount),
            averageTransactionAmount: Number(recoveryForm.averageTransactionAmount),
            customerLifetimeValue: Number(recoveryForm.customerLifetimeValue),
            daysSinceLastPurchase: Number(recoveryForm.daysSinceLastPurchase),
            purchaseFrequency: Number(recoveryForm.purchaseFrequency),
            hour: Number(recoveryForm.hour),
            dayOfWeek: Number(recoveryForm.dayOfWeek)
          })
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || result.error || "Recovery request failed"
        );
      }

      setRecoveryResult(result.data || result);
      showToast("Recovery case created successfully");

      // Refresh live pages when the user navigates to them.
      setPage("Recovery Cases");
    } catch (error) {
      console.error("UI Recovery Error:", error);
      setRecoveryResult({
        error: error.message || "Unable to create recovery case"
      });
    } finally {
      setRecoverySubmitting(false);
    }
  };

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
          `${API_URL}/api/dashboard/stats`
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
          `${API_URL}/api/recovery/cases`
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
            item.updatedAt,

          paymentLinkUrl:
            item.paymentLinkUrl || ""
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
          `${API_URL}/api/customers`
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
          `${API_URL}/api/webhooks/events`
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
  onRunLiveRecovery={openRecoveryForm}
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

    {showRecoveryForm &&
      <RecoveryModal
        form={recoveryForm}
        setForm={setRecoveryForm}
        submitting={recoverySubmitting}
        result={recoveryResult}
        onSubmit={submitRecoveryCase}
        onClose={() => {
          if (!recoverySubmitting) {
            setShowRecoveryForm(false);
            setRecoveryResult(null);
          }
        }}
      />
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
  liveCases,
  onRunLiveRecovery
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
        onClick={onRunLiveRecovery}
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



function RecoveryModal({
  form,
  setForm,
  submitting,
  result,
  onSubmit,
  onClose
}) {
  const update = (key, value) => {
    setForm(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(15, 23, 42, .48)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        overflowY: "auto"
      }}
    >
      <div
        style={{
          width: "min(900px, 100%)",
          maxHeight: "92vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 25px 70px rgba(15, 23, 42, .25)",
          padding: 24
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            marginBottom: 20
          }}
        >
          <div>
            <div className="eyebrow">
              <Sparkles size={15} />
              LIVE RECOVERY
            </div>
            <h2 style={{ margin: "8px 0 5px" }}>
              Create Recovery Case
            </h2>
            <p style={{ margin: 0, color: "#657087" }}>
              Enter a failed payment scenario and let RecoverAI score,
              diagnose, gate and execute the permitted recovery action.
            </p>
          </div>

          <button
            className="iconBtn"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16
            }}
          >
            {[
              ["transactionId", "Transaction ID", "text"],
              ["customerId", "Customer ID", "text"],
              ["amount", "Amount (₹)", "number"],
              ["averageTransactionAmount", "Average Transaction (₹)", "number"],
              ["customerLifetimeValue", "Customer Lifetime Value (₹)", "number"],
              ["previousSuccessCount", "Previous Successes", "number"],
              ["previousFailureCount", "Previous Failures", "number"],
              ["daysSinceLastPurchase", "Days Since Last Purchase", "number"],
              ["purchaseFrequency", "Purchase Frequency", "number"],
              ["attemptNumber", "Attempt Number", "number"],
              ["hour", "Hour (0–23)", "number"]
            ].map(([key, label, type]) => (
              <label key={key} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{label}</span>
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => update(key, e.target.value)}
                  required
                  min={type === "number" ? 0 : undefined}
                  max={key === "hour" ? 23 : undefined}
                />
              </label>
            ))}

            <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Payment Method</span>
              <select
                value={form.paymentMethod}
                onChange={e => update("paymentMethod", e.target.value)}
              >
                <option value="netbanking">Netbanking</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="wallet">Wallet</option>
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Failure Reason</span>
              <select
                value={form.failureReason}
                onChange={e => update("failureReason", e.target.value)}
              >
                <option value="network_error">Network Error</option>
                <option value="bank_timeout">Bank Timeout</option>
                <option value="incorrect_otp">Incorrect OTP</option>
                <option value="insufficient_funds">Insufficient Funds</option>
                <option value="issuer_decline">Issuer Decline</option>
                <option value="expired_card">Expired Card</option>
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Subscription</span>
              <select
                value={form.subscriptionStatus}
                onChange={e => update("subscriptionStatus", e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Device</span>
              <select
                value={form.deviceType}
                onChange={e => update("deviceType", e.target.value)}
              >
                <option value="mobile">Mobile</option>
                <option value="desktop">Desktop</option>
                <option value="tablet">Tablet</option>
              </select>
            </label>
          </div>

          <div
            style={{
              marginTop: 18,
              padding: "12px 14px",
              borderRadius: 12,
              background: "#f7f8fc",
              color: "#657087",
              fontSize: 13
            }}
          >
            Tip: use <b>₹15,000 + network_error</b> to demonstrate the
            Payment Link recovery flow. Use <b>₹75,000</b> to demonstrate
            the high-value policy escalation.
          </div>

          {result?.error &&
            <div
              className="emptyNote"
              style={{ marginTop: 16 }}
            >
              {result.error}
            </div>
          }

          {result && !result.error &&
            <div
              style={{
                marginTop: 18,
                padding: 16,
                borderRadius: 14,
                background: "#f0fdf8",
                border: "1px solid #c9f1df"
              }}
            >
              <b>Recovery case created</b>
              <div style={{ marginTop: 8, display: "grid", gap: 5, color: "#465166" }}>
                <span>Case: <b>{result.caseId || "—"}</b></span>
                <span>
                  Recovery probability:{" "}
                  <b>
                    {typeof result.recoveryProbability === "number"
                      ? `${(result.recoveryProbability * 100).toFixed(1)}%`
                      : "—"}
                  </b>
                </span>
                <span>Diagnosis: <b>{result.aiDiagnosis || "—"}</b></span>
                <span>Recommended action: <b>{result.recommendedAction || "—"}</b></span>
                <span>Policy: <b>{result.policyDecision || result.policy?.decision || "—"}</b></span>
              </div>

              {result.paymentLinkUrl &&
                <div style={{ marginTop: 14 }}>
                  <a
                    href={result.paymentLinkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="primary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      textDecoration: "none"
                    }}
                  >
                    <Link2 size={17} />
                    Open Razorpay Payment Link
                  </a>
                </div>
              }

              {result.recommendedAction === "escalate" &&
                <div style={{ marginTop: 12, color: "#92400e" }}>
                  No payment link was created because the policy engine
                  escalated this high-value case for review.
                </div>
              }
            </div>
          }

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 22
            }}
          >
            <button
              type="button"
              className="secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Close
            </button>

            <button
              type="submit"
              className="primary"
              disabled={submitting}
            >
              {submitting
                ? "Running recovery..."
                : "Analyze & Recover"}
              {!submitting && <ArrowUpRight size={17} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
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
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span>{c.action}</span>
                {c.paymentLinkUrl &&
                  c.status !== "recovered" &&
                  <a
                    href={c.paymentLinkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="textBtn"
                    style={{ textDecoration: "none" }}
                  >
                    Open link
                  </a>
                }
              </div>
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