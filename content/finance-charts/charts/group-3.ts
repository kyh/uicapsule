import { BudgetHealth } from "./budget-health";
import { BudgetOverview } from "./budget-overview";
import { BudgetPlan } from "./budget-plan";
import { CashFlowDailyBar } from "./cash-flow-daily-bar";
import { CategoryBreakdown } from "./category-breakdown";
import type { ChartEntry } from "./entry";
import { SalesTarget } from "./sales-target";
import { SpendingOverviewCylinder } from "./spending-overview-cylinder";
import { SpendingOverviewRange } from "./spending-overview-range";
import { YourAsset } from "./your-asset";

// cash-flow-daily-bar, spending-overview-range, budget-overview, sales-target, your-asset, budget-plan, spending-overview-cylinder, budget-health, category-breakdown
export const GROUP_3: ChartEntry[] = [
  { Chart: CashFlowDailyBar, id: "cash-flow-daily-bar" },
  { Chart: SpendingOverviewRange, id: "spending-overview-range" },
  { Chart: BudgetOverview, id: "budget-overview" },
  { Chart: SalesTarget, id: "sales-target" },
  { Chart: YourAsset, id: "your-asset" },
  { Chart: BudgetPlan, id: "budget-plan" },
  { Chart: SpendingOverviewCylinder, id: "spending-overview-cylinder" },
  { Chart: BudgetHealth, id: "budget-health" },
  { Chart: CategoryBreakdown, id: "category-breakdown" },
];
