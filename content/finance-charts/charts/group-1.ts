import { Balance } from "./balance";
import { CashFlowArea } from "./cash-flow-area";
import { CashFlowMonthlyBar } from "./cash-flow-monthly-bar";
import { CumulativeAssetsAndLiabilities } from "./cumulative-assets-and-liabilities";
import { CustomerRate } from "./customer-rate";
import type { ChartEntry } from "./entry";
import { Overview } from "./overview";
import { TotalExpenses } from "./total-expenses";
import { TotalSales } from "./total-sales";

// total-expenses, cash-flow-area, overview, price-range, balance, total-sales, customer-rate, cumulative-assets-and-liabilities, cash-flow-monthly-bar
export const GROUP_1: ChartEntry[] = [
  { Chart: TotalExpenses, id: "total-expenses" },
  { Chart: CashFlowArea, id: "cash-flow-area" },
  { Chart: Overview, id: "overview" },
  { Chart: Balance, id: "balance" },
  { Chart: TotalSales, id: "total-sales" },
  { Chart: CustomerRate, id: "customer-rate" },
  { Chart: CumulativeAssetsAndLiabilities, id: "cumulative-assets-and-liabilities" },
  { Chart: CashFlowMonthlyBar, id: "cash-flow-monthly-bar" },
];
