import type { ChartEntry } from "./entry";
import { AssetOverviewRadial } from "./asset-overview-radial";
import { BudgetAllocation } from "./budget-allocation";
import { FinanceOverviewDivergingBar } from "./finance-overview-diverging-bar";
import { FinanceOverviewFlow } from "./finance-overview-flow";
import { InvestmentAppAdoptionByCountry } from "./investment-app-adoption-by-country";
import { OptionsPortfolio } from "./options-portfolio";
import { RevenueGrowth } from "./revenue-growth";
import { SavingProgress } from "./saving-progress";
import { ValueLocked } from "./value-locked";

// finance-overview-flow, value-locked, saving-progress, finance-overview-diverging-bar, budget-allocation, asset-overview-radial, options-portfolio, revenue-growth, investment-app-adoption-by-country
export const GROUP_4: ChartEntry[] = [
  { Chart: FinanceOverviewFlow, id: "finance-overview-flow" },
  { Chart: ValueLocked, id: "value-locked" },
  { Chart: SavingProgress, id: "saving-progress" },
  { Chart: FinanceOverviewDivergingBar, id: "finance-overview-diverging-bar" },
  { Chart: BudgetAllocation, id: "budget-allocation" },
  { Chart: AssetOverviewRadial, id: "asset-overview-radial" },
  { Chart: OptionsPortfolio, id: "options-portfolio" },
  { Chart: RevenueGrowth, id: "revenue-growth" },
  { Chart: InvestmentAppAdoptionByCountry, id: "investment-app-adoption-by-country" },
];
