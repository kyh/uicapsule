import type { ChartEntry } from "./entry";
import { Ethereum } from "./ethereum";
import { FinanceAnalytics } from "./finance-analytics";
import { GlobalFinanceMarketCombo } from "./global-finance-market-combo";
import { IncomeOverview } from "./income-overview";
import { PortfolioAllocation } from "./portfolio-allocation";
import { RevenueOverview } from "./revenue-overview";
import { SpendingOverviewScatter } from "./spending-overview-scatter";

export const GROUP_7: ChartEntry[] = [
  { Chart: IncomeOverview, id: "income-overview" },
  { Chart: SpendingOverviewScatter, id: "spending-overview-scatter" },
  { Chart: GlobalFinanceMarketCombo, id: "global-finance-market-combo" },
  { Chart: FinanceAnalytics, id: "finance-analytics" },
  { Chart: Ethereum, id: "ethereum" },
  { Chart: RevenueOverview, id: "revenue-overview" },
  { Chart: PortfolioAllocation, id: "portfolio-allocation" },
];
