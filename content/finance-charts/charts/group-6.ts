import type { ChartEntry } from "./entry";
import { AssetAllocation } from "./asset-allocation";
import { AssetOverviewBar } from "./asset-overview-bar";
import { Expenses } from "./expenses";
import { GrowthTrends } from "./growth-trends";
import { MonthlyIncome } from "./monthly-income";
import { ProfitMarginAnalysis } from "./profit-margin-analysis";
import { ProjectBudgetAllocation } from "./project-budget-allocation";
import { SalesPerformance } from "./sales-performance";
import { TotalRevenue } from "./total-revenue";

export const GROUP_6: ChartEntry[] = [
  { Chart: GrowthTrends, id: "growth-trends" },
  { Chart: AssetAllocation, id: "asset-allocation" },
  { Chart: ProfitMarginAnalysis, id: "profit-margin-analysis" },
  { Chart: MonthlyIncome, id: "monthly-income" },
  { Chart: AssetOverviewBar, id: "asset-overview-bar" },
  { Chart: SalesPerformance, id: "sales-performance" },
  { Chart: Expenses, id: "expenses" },
  { Chart: TotalRevenue, id: "total-revenue" },
  { Chart: ProjectBudgetAllocation, id: "project-budget-allocation" },
];
