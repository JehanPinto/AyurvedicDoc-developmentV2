import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Users,
  Wallet,
  RefreshCcw,
  CalendarClock,
  BadgeDollarSign,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingPage } from "@/components/ui/loading-spinner";

interface DoctorPayout {
  doctorId: string;
  doctorName: string;
  earnAmount: number;
  completedSessions: number;
  totalSessions: number;
  platformFees: number;
  cancellationRate: number;
  cancellationFees: number;
  applicableTax: number;
  payoutAmount: number;
}

interface PayoutStats {
  pendingPayoutsCount: number;
  totalOutstanding: number;
  completedLastMonthAmount: number;
  completedLastMonthCount: number;
  nextPayoutDate: string;
}

interface PayoutData {
  doctors: DoctorPayout[];
  stats: PayoutStats;
}

function formatLKR(amount: number) {
  return `LKR ${amount.toLocaleString("en-LK")}`;
}

function doctorDisplayName(name: string) {
  return name.startsWith("Dr.") || name.startsWith("Dr ") ? name : `Dr. ${name}`;
}

// > 0 → red, = 0 → #3746D3 blue
function amountColor(value: number) {
  return value > 0 ? "text-red-500" : "text-[#3746D3]";
}

export default function AdminPayoutsPage() {
  const { data, isLoading, isError } = useQuery<PayoutData>({
    queryKey: ["/api/admin/payouts"],
    staleTime: 60 * 1000,
  });

  if (isLoading) return <LoadingPage />;
  if (isError || !data) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Failed to load payout data.
      </div>
    );
  }

  const { doctors, stats } = data;
  const nextPayout = new Date(stats.nextPayoutDate);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payout Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review earnings and disburse payments to verified practitioners.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Payouts */}
        <Card className="border border-primary/30">
          <CardContent className="p-5 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">Pending Payouts</span>
            </div>
            <p className="text-4xl font-bold text-foreground">{stats.pendingPayoutsCount}</p>
            <p className="text-sm text-primary font-medium">{formatLKR(stats.totalOutstanding)} in queue</p>
          </CardContent>
        </Card>

        {/* Total Outstanding */}
        <Card className="border border-primary/30">
          <CardContent className="p-5 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <BadgeDollarSign className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">Total outstanding</span>
            </div>
            <p className="text-2xl font-bold text-foreground whitespace-nowrap">{formatLKR(stats.totalOutstanding)}</p>
            <p className="text-sm text-muted-foreground">Ready for payout</p>
          </CardContent>
        </Card>

        {/* Completed Last Month */}
        <Card className="border border-primary/30">
          <CardContent className="p-5 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <RefreshCcw className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">Completed last month</span>
            </div>
            <p className="text-2xl font-bold text-foreground whitespace-nowrap">{formatLKR(stats.completedLastMonthAmount)}</p>
            <p className="text-sm text-muted-foreground">{stats.completedLastMonthCount} successful transfers</p>
          </CardContent>
        </Card>

        {/* Next Payout Date */}
        <Card className="border border-primary/30">
          <CardContent className="p-5 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <CalendarClock className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">Next payout date</span>
            </div>
            <p className="text-2xl font-bold text-foreground whitespace-nowrap">{format(nextPayout, "MMM d, yyyy")}</p>
            <p className="text-sm text-muted-foreground">Scheduled · Friday</p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Table */}
      <Card className="border border-primary/20">
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">Doctor Name</th>
                <th className="text-right px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">Earn Amount</th>
                <th className="text-center px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">Sessions</th>
                <th className="text-right px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">Platform Fees</th>
                <th className="text-center px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">Cancel Rate</th>
                <th className="text-right px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">Cancel Fees</th>
                <th className="text-right px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">Tax</th>
                <th className="text-right px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">Payout Amount</th>
                <th className="text-center px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {doctors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted-foreground">
                    No payout data available for this month.
                  </td>
                </tr>
              ) : (
                doctors.map((doc) => (
                  <tr key={doc.doctorId} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">
                      {doctorDisplayName(doc.doctorName)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-foreground whitespace-nowrap">
                      {formatLKR(doc.earnAmount)}
                    </td>
                    <td className="px-3 py-2.5 text-center text-foreground whitespace-nowrap">
                      {doc.completedSessions}/{doc.totalSessions}
                    </td>
                    <td className={`px-3 py-2.5 text-right whitespace-nowrap font-medium ${amountColor(doc.platformFees)}`}>
                      {formatLKR(doc.platformFees)}
                    </td>
                    <td className={`px-3 py-2.5 text-center whitespace-nowrap font-medium ${amountColor(doc.cancellationRate)}`}>
                      {doc.cancellationRate}%
                    </td>
                    <td className={`px-3 py-2.5 text-right whitespace-nowrap font-medium ${amountColor(doc.cancellationFees)}`}>
                      {formatLKR(doc.cancellationFees)}
                    </td>
                    <td className={`px-3 py-2.5 text-right whitespace-nowrap font-medium ${amountColor(doc.applicableTax)}`}>
                      {formatLKR(doc.applicableTax)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-foreground whitespace-nowrap">
                      {formatLKR(doc.payoutAmount)}
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <Button
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 h-7 rounded-md"
                        disabled={doc.payoutAmount === 0}
                      >
                        <Wallet className="w-3 h-3 mr-1" />
                        Pay Now
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
