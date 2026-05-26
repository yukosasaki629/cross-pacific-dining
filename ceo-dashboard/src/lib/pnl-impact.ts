// =============================================================================
// 各トピックの P&L 影響と戦略カテゴリを自動判定
// =============================================================================
// レストラン経営の RLOP 構造に基づく:
//   RLOP = Sales - Food Cost - Labor Cost - Other Op - Occupancy
// なので「P&L 影響」は Sales / FoodCost / LaborCost / G&A の4軸に集約。

export type PnlImpact = "sales" | "food_cost" | "labor_cost" | "ga" | null;
export type StrategicCategory = "aop" | "strategy" | "board" | null;

export const PNL_IMPACT_LABEL: Record<string, string> = {
  sales: "📈 Sales",
  food_cost: "💰 FoodCost削減",
  labor_cost: "👥 LaborCost削減",
  ga: "🏢 G&A",
};

export const PNL_IMPACT_LONG_LABEL: Record<string, string> = {
  sales: "📈 Sales(売上)",
  food_cost: "💰 FoodCost削減(食材原価)",
  labor_cost: "👥 LaborCost削減(人件費)",
  ga: "🏢 G&A(本社コスト)",
};

export const PNL_IMPACT_COLOR: Record<string, string> = {
  sales: "bg-accent-50 text-accent-700",
  food_cost: "bg-ok-50 text-ok-700",
  labor_cost: "bg-warn-50 text-warn-700",
  ga: "bg-ink-100 text-ink-700",
};

export const STRATEGIC_LABEL: Record<string, string> = {
  aop: "📊 AOP",
  strategy: "🎯 Strategy",
  board: "🏛 Board",
};

export const STRATEGIC_COLOR: Record<string, string> = {
  aop: "bg-accent-50 text-accent-700",
  strategy: "bg-warn-50 text-warn-700",
  board: "bg-bad-50 text-bad-700",
};

// 自動判定:キーワードベース
export function detectPnlImpact(text: string): PnlImpact {
  // 順序大事(より具体的なものを先に。Labor 系は Sales の "comp" などと衝突しないよう先に)

  // G&A 系(本社・人事・法務・経理・IT・professional fees)
  if (
    /(G&A|RSC|headcount|recruiting|採用|HR\b|人事|CFO候補|CFO search|controller|payroll|AP\s|finance team|accounting team|legal|訴訟|lawsuit|professional fees|mediation|business license|corporate(?!\s*responsibility)|administrative|R&M\b|IT\s|department|division of duties|backfill|G&A leverage|professional)/i.test(text)
  ) {
    return "ga";
  }

  // Labor Cost 系(店舗人件費・シフト・回転)
  if (
    /(labor cost|人件費|scheduling|シフト|productivity|turn time|table utilization|seat utilization|daypart|peak hour|staffing|店舗運営|店舗実行|NRO\s|opening team|hourly|店舗マネージャー|Restaurant operations|4-wall|prep timing)/i.test(text)
  ) {
    return "labor_cost";
  }

  // Food Cost 系(食材・COGS・レシピ・rebate・vendor)
  if (
    /(food cost|COGS|食材|原価|theoretical food cost|recipe|レシピ|food margin|food waste|distributor|vendor(?! investigation)|rebate|Coke|Dr Pepper|hand roll|Kura Reserve.*margin|ingredient|portion|yield|menu margin|hand roll promotion|R365)/i.test(text)
  ) {
    return "food_cost";
  }

  // Sales 系(売上・販促・new opening・brand experience)
  if (
    /(売上|sales|comp sales|comp\s|traffic|redemption|ticket|guest count|AUV|販促|promotion|marketing|IP collab|IP コラボ|LTO|Kura Reserve|loyalty|guest experience|guest satisfaction|Tattle|Guest Voice|new opening|store opening|新店|出店|new restaurant|TikTok|Instagram|YouTube|advertising|paid media|brand experience|customer)/i.test(text)
  ) {
    return "sales";
  }

  return null;
}

// 戦略カテゴリ判定
export function detectStrategicCategory(text: string): StrategicCategory {
  // Board / Governance(取締役会・委員会・SOX)
  if (
    /(取締役会|Board\b|Audit Committee|Comp Committee|Nominating Committee|監査委員会|報酬委員会|指名委員会|proxy|SOX|governance|vendor integrity|kickback|board prep)/i.test(text)
  ) {
    return "board";
  }

  // AOP / 計画(FY27 計画・headcount plan・budget・goals)
  if (
    /(AOP|FY27|FY28|annual operating plan|計画|budget|target|headcount plan|FY26.*budget|目標|forecast|five year plan|変動費|fixed cost)/i.test(text)
  ) {
    return "aop";
  }

  // Strategy / Vision(Vision・Brand・Customer・Purpose)
  if (
    /(strategy|戦略|Vision|Mission|Purpose|Values|brand strategy|brand experience|culture|positioning|10[ -]?year|long[ -]?term|leadership development)/i.test(text)
  ) {
    return "strategy";
  }

  return null;
}
