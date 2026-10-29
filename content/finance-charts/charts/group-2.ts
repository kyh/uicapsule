import { Analytics } from "./analytics";
import { Budget } from "./budget";
import { CashBalance } from "./cash-balance";
import type { ChartEntry } from "./entry";
import { FinanceOverviewArea } from "./finance-overview-area";
import { FinancialBreakdown } from "./financial-breakdown";
import { FinancialTrends } from "./financial-trends";
import { InvestmentPerformance } from "./investment-performance";
import { NetWorth } from "./net-worth";
import { TotalBalance } from "./total-balance";

// cash-balance, net-worth, financial-breakdown, finance-overview-area, total-balance, budget, investment-performance, financial-trends, analytics
export const GROUP_2: ChartEntry[] = [
  { Chart: CashBalance, id: "cash-balance" },
  { Chart: NetWorth, id: "net-worth" },
  { Chart: FinancialBreakdown, id: "financial-breakdown" },
  { Chart: FinanceOverviewArea, id: "finance-overview-area" },
  { Chart: TotalBalance, id: "total-balance" },
  { Chart: Budget, id: "budget" },
  { Chart: InvestmentPerformance, id: "investment-performance" },
  { Chart: FinancialTrends, id: "financial-trends" },
  { Chart: Analytics, id: "analytics" },
];
