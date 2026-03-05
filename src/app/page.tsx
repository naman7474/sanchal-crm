"use client";

import { useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Wallet, BarChart, AlertTriangle, MessageSquare, Phone, Loader2, UserPlus } from "lucide-react";
import { useDashboardStats, useExpiringPolicies, useTodayFollowUps } from "@/lib/hooks/use-dashboard";
import { useAuth } from "@/providers/AuthProvider";
import { QuickCreateCustomer } from "@/components/customers/QuickCreateCustomer";
import Link from "next/link";

function formatCurrency(amount: number | null): string {
  if (!amount) return "₹0";
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function Home() {
  const { profile } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: expiringPolicies, isLoading: expiringLoading } = useExpiringPolicies(7);
  const { data: followUps, isLoading: followUpsLoading } = useTodayFollowUps();
  const [showCreate, setShowCreate] = useState(false);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-4 md:p-6 max-w-[1280px] mx-auto w-full">

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 md:mb-8">
        <StatCard
          label="Active Policies"
          value={statsLoading ? "—" : String(stats?.active_policies ?? 0)}
          icon={<ClipboardList className="w-5 h-5 text-indigo-600" />}
          accentClass="bg-indigo-50"
        />
        <StatCard
          label="This Month Premium"
          value={statsLoading ? "—" : formatCurrency(stats?.current_month_premium ?? 0)}
          icon={<Wallet className="w-5 h-5 text-emerald-600" />}
          accentClass="bg-emerald-50"
        />
        <StatCard
          label="Commission Earned"
          value={statsLoading ? "—" : formatCurrency(stats?.current_month_commission ?? 0)}
          icon={<BarChart className="w-5 h-5 text-amber-600" />}
          accentClass="bg-amber-50"
        />
        <StatCard
          label="Expiring (30 days)"
          value={statsLoading ? "—" : String(stats?.expiring_30 ?? 0)}
          icon={<AlertTriangle className="w-5 h-5 text-orange-600" />}
          accentClass="bg-orange-50"
        />
      </div>

      {/* Main 2-Column Content */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Left Column: Alerts */}
        <div className="flex-1">
          <div className="bg-white border text-card-foreground shadow-sm rounded-xl p-0">
            <div className="flex flex-col space-y-1.5 p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                  <span className="text-lg">⏰</span> Expiring This Week
                </h3>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/5" asChild>
                  <Link href="/reports">View All →</Link>
                </Button>
              </div>
            </div>
            <div className="p-0">
              {expiringLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
                </div>
              ) : !expiringPolicies?.length ? (
                <div className="text-center py-12 text-slate-500">
                  <p className="text-lg mb-1">🎉</p>
                  <p className="text-sm">No policies expiring this week!</p>
                </div>
              ) : (
                expiringPolicies.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between p-4 md:p-6 border-b last:border-0 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="font-semibold text-[15px]">{p.customer_name}</div>
                      <div className="text-[13px] text-muted-foreground mt-0.5">
                        {p.product} <span className="mx-1">·</span> {p.company_name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      <Badge
                        variant={p.urgency === "EXPIRED" || p.urgency === "CRITICAL" ? "destructive" : "secondary"}
                        className="text-xs uppercase tracking-wider hidden md:inline-flex"
                      >
                        {p.days_until_expiry <= 0 ? "Expired" : `${p.days_until_expiry}d left`}
                      </Badge>
                      <span className="md:hidden text-xs font-semibold mr-1" style={{ color: p.urgency === "EXPIRED" || p.urgency === "CRITICAL" ? "#E11D48" : "#EA580C" }}>
                        {p.days_until_expiry <= 0 ? "Expired" : `${p.days_until_expiry}d`}
                      </span>
                      {p.mobile_no && (
                        <Button
                          size="sm"
                          className="bg-[#25D366] hover:bg-[#20BE5B] text-white rounded-lg h-9 w-9 p-0 md:w-auto md:px-3 shadow-none border-none"
                          asChild
                        >
                          <a
                            href={`https://wa.me/91${p.mobile_no?.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(`Hi ${p.customer_name}, your ${p.product} policy with ${p.company_name} is expiring on ${new Date(p.end_date).toLocaleDateString("en-GB")}. Please contact us for renewal.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageSquare className="w-4 h-4 md:mr-2" />
                            <span className="hidden md:inline">WhatsApp</span>
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Tasks */}
        <div className="w-full lg:w-[320px] xl:w-[380px] flex flex-col gap-6">

          <div className="bg-white border text-card-foreground shadow-sm rounded-xl p-5 md:p-6 hidden lg:block">
            <h3 className="font-semibold leading-none tracking-tight mb-5 text-[16px]">Quick Actions</h3>
            <div className="flex flex-col gap-3">
              <Button
                className="w-full justify-start text-[14px] font-semibold h-11"
                size="lg"
                onClick={() => setShowCreate(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" /> New Customer
              </Button>
            </div>
          </div>

          <div className="bg-white border text-card-foreground shadow-sm rounded-xl p-5 md:p-6">
            <h3 className="font-semibold leading-none tracking-tight mb-4 flex items-center gap-2 text-[16px]">
              <Phone className="w-4 h-4 text-slate-400" /> Today&apos;s Follow-ups
            </h3>
            <div className="flex flex-col">
              {followUpsLoading ? (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading...
                </div>
              ) : !followUps?.length ? (
                <p className="text-sm text-slate-500 py-4">No follow-ups scheduled for today.</p>
              ) : (
                followUps.map((f, i) => (
                  <div key={f.id} className="py-3 border-b last:border-0 hover:bg-slate-50 rounded-md -mx-2 px-2 transition-colors cursor-pointer">
                    <div className="font-semibold text-[14px] leading-tight">{f.name}</div>
                    <div className="text-[13px] text-muted-foreground mt-1">
                      {f.interested_product || f.notes || "Follow up scheduled"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      <QuickCreateCustomer open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
