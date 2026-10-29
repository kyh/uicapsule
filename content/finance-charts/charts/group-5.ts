import { AverageSales } from "./average-sales";
import type { ChartEntry } from "./entry";
import { FinanceOverviewStackedBar } from "./finance-overview-stacked-bar";
import { FinanceOverviewTimeline } from "./finance-overview-timeline";
import { GlobalDefi } from "./global-defi";
import { GlobalFinanceMarketForecast } from "./global-finance-market-forecast";
import { InvestmentAppUserAge } from "./investment-app-user-age";
import { InvestmentGrowth } from "./investment-growth";
import { Performance } from "./performance";
import { RevenueByProductLine } from "./revenue-by-product-line";

export const GROUP_5: ChartEntry[] = [
  { Chart: GlobalFinanceMarketForecast, id: "global-finance-market-forecast" },
  { Chart: AverageSales, id: "average-sales" },
  { Chart: Performance, id: "performance" },
  { Chart: InvestmentGrowth, id: "investment-growth" },
  { Chart: GlobalDefi, id: "global-defi" },
  { Chart: InvestmentAppUserAge, id: "investment-app-user-age" },
  { Chart: FinanceOverviewStackedBar, id: "finance-overview-stacked-bar" },
  { Chart: FinanceOverviewTimeline, id: "finance-overview-timeline" },
  { Chart: RevenueByProductLine, id: "revenue-by-product-line" },
];
