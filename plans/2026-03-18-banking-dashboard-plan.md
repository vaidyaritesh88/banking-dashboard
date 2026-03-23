# Banking Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a 6-page Streamlit dashboard for Indian banking sector analysis with DuPont decomposition, ratio screening, time-series deep dives, sector analytics, novel metrics, and cards/rates tracking.

**Architecture:** Multi-page Streamlit app with a shared data layer. Data is parsed from 9 Excel files into normalized pandas DataFrames at startup (cached). A global sidebar provides bank type, bank selection, and period filters. Each page uses Plotly for interactive charts.

**Tech Stack:** Python 3.11+, Streamlit, Pandas, Plotly, Openpyxl

---

## Phase 1: Data Pipeline

### Task 1: Project Setup & Dependencies

**Files:**
- Create: `requirements.txt`
- Create: `app.py` (minimal entry point)
- Create: `.streamlit/config.toml`

**Step 1:** Create requirements.txt
```
streamlit>=1.30.0
pandas>=2.0.0
plotly>=5.18.0
openpyxl>=3.1.0
xlrd>=2.0.0
```

**Step 2:** Create minimal app.py that confirms Streamlit runs

**Step 3:** Create .streamlit/config.toml with wide layout default

**Step 4:** Run `pip install -r requirements.txt` and `streamlit run app.py` to verify

**Step 5:** Commit: "chore: project setup with dependencies"

---

### Task 2: Bank Mapping & Classification

**Files:**
- Create: `data/mappings.py`

**Purpose:** Parse the Mapping sheet from Banks_dashboard_quarterly.xlsx to create a bank-to-group classification that handles mergers over time.

**Parsing coordinates:**
- File: Banks_dashboard_quarterly.xlsx, sheet "Mapping"
- Row 5, cols 2-80: Quarter headers ('1QFY07' through '3QFY26')
- Rows 7-48, col 1: Bank tickers
- Rows 7-48, cols 2-80: Group values (PSU, PVT_NONREG, PVT_REG, SFB)

**Output:**
- `get_bank_mapping()` -> DataFrame with columns: [bank_ticker, quarter, group]
- `get_bank_groups()` -> dict mapping group names to lists of bank tickers
- `BANK_DISPLAY_NAMES` -> dict mapping tickers to full names
- `PRESET_FILTERS` -> dict with "Top 5 Private", "Top 5 PSU", etc.
- Quarter parser: convert '1QFY07' -> datetime

**Step 1:** Implement mappings.py with all functions
**Step 2:** Test by running a quick script that prints bank groups
**Step 3:** Commit: "feat: bank mapping and classification system"

---

### Task 3: Quarterly Metrics Loader (Banks_dashboard_quarterly.xlsx)

**Files:**
- Create: `data/loader_quarterly_metrics.py`

**Purpose:** Parse all 73 sheets from the quarterly dashboard file into a single long-format DataFrame.

**Parsing pattern (same for all metric sheets):**
- Row 5, cols 2-80: Quarter headers
- Rows 7+, col 1: Bank tickers
- Rows 7+, cols 2-80: Numeric values

**Output:** `load_quarterly_metrics()` -> DataFrame with columns: [bank, quarter, metric, value]
- Metrics: NII, Int_inc, Int_exp, Revenue, OpEx, PPOP, LLP, PBT, PAT, RoE, RoA, NIM, Cost_income, GNPA_ratio, NNPA_ratio, CASA_ratio, CD_ratio, etc. (all 73 sheets minus Mapping)

**Step 1:** Implement the loader with sheet iteration and long-format pivoting
**Step 2:** Add quarter-to-datetime conversion
**Step 3:** Test by loading and printing shape + sample
**Step 4:** Commit: "feat: quarterly metrics loader for 73-sheet dashboard file"

---

### Task 4: Individual Bank Quarterly Loader (Banks_quarterly database.xlsx)

**Files:**
- Create: `data/loader_bank_quarterly.py`

**Purpose:** Parse individual bank sheets (42 banks + 8 consolidated groups) with full P&L, balance sheet, deposit mix, NPA flows, and margin metrics.

**Parsing coordinates (per bank sheet):**
- Row 3, cols 2-88: Quarter headers ('1QFY05' through '3QFY26')
- Rows 4-95, col 1: Metric labels (leading spaces to strip)
- Rows 4-95, cols 2-88: Values

**Row-to-metric mapping:**
```python
ROW_METRICS = {
    4: 'Interest Earned', 5: 'Interest on Loans', 6: 'Interest on Investment',
    9: 'Interest Expense', 10: 'NII', 11: 'Other Income', 12: 'Total Income',
    13: 'Operating Expenses', 14: 'Employee Expenses', 15: 'Other OpEx',
    16: 'PPOP', 17: 'Provisions', 18: 'PBT', 19: 'Tax', 20: 'PAT',
    23: 'Net Profit/Op Profit', 24: 'NII/Interest Income', 25: 'Cost-Income',
    28: 'NII Growth', 29: 'Non-II Growth', 30: 'Revenue Growth',
    31: 'OpEx Growth', 32: 'PPOP Growth', 33: 'Provisions Growth', 34: 'PAT Growth',
    37: 'Gross NPA', 38: 'GNPA %', 39: 'Net NPA', 40: 'NNPA %',
    41: 'PCR %', 42: 'Gross Loans', 43: 'Net Loans',
    47: 'Equity', 48: 'Reserves', 49: 'Net Worth', 50: 'Deposits',
    51: 'Borrowings', 52: 'Other Liabilities', 53: 'Total Liabilities',
    56: 'Cash & RBI Balance', 57: 'Money at Call', 58: 'Investments',
    59: 'Advances', 60: 'Fixed Assets', 61: 'Other Assets', 62: 'Total Assets',
    66: 'Current Deposits', 67: 'Savings Deposits', 68: 'CASA Deposits',
    69: 'Term Deposits', 70: 'Total Deposits (Bn)',
    72: 'Current %', 73: 'Savings %', 74: 'CASA %', 75: 'Term %',
    78: 'Opening NPL', 79: 'Slippages', 80: 'Recovery & Upgrades',
    81: 'Write-offs', 82: 'Closing NPLs',
    93: 'Yield on Advances', 94: 'Cost of Funds', 95: 'NIM'
}
```

**Output:** `load_bank_quarterly_data()` -> dict of DataFrames keyed by bank ticker, each with columns: [quarter, metric1, metric2, ...]

**Step 1:** Implement the parser
**Step 2:** Also parse consolidated sheets (Consolidated, Cons_private, Cons_public, etc.)
**Step 3:** Test by loading HDFCB and printing all metrics
**Step 4:** Commit: "feat: individual bank quarterly data loader"

---

### Task 5: Annual Databook Loader (Banks_databook.xlsx)

**Files:**
- Create: `data/loader_annual.py`

**Purpose:** Parse 91-sheet annual databook (FY2001-FY2028E).

**Parsing coordinates (same pattern as quarterly metrics):**
- Row 5, cols 2-29: Year headers (2001 through '2028E')
- Rows 7+, col 1: Bank tickers
- Rows 7+, cols 2-29: Values
- Cols 30-32: Period averages (5yr, 10yr, cycle)

**Output:** `load_annual_metrics()` -> DataFrame [bank, year, metric, value]

**Step 1:** Implement with same pattern as quarterly metrics loader
**Step 2:** Handle estimate years ('2026E', '2027E', '2028E') with a flag column
**Step 3:** Test by loading and checking ROE for HDFCB
**Step 4:** Commit: "feat: annual databook loader with estimates"

---

### Task 6: Supplementary Data Loaders

**Files:**
- Create: `data/loader_supplementary.py`

**Purpose:** Parse the remaining files: JP file (RBI fortnightly, loan splits, branch vintage), CASA, deposit rates, credit cards, system data, asset quality.

**Sub-loaders:**

1. `load_rbi_fortnightly()` - JP file, sheet "RBI_Fortnightly data"
   - Cols: Date, Deposits, Advances, CD Ratio, Incremental CD Ratio, CPs Outstanding

2. `load_loan_book_split()` - JP file, sheet "Private Banks"
   - 7 banks x segment-level loan data (quarterly)

3. `load_branch_vintage()` - JP file, sheet "Branch vintage calculation"
   - Vintage distribution for 6 major banks

4. `load_deposit_rates()` - Bank deposits rates.xlsx
   - Parse date-stamped sheets for SA/TD rates by bank

5. `load_credit_cards()` - Credit cards.xlsm
   - Cards in force, transaction volumes, market share

6. `load_system_data()` - 20240109_System_Credit_Deposit_Data.xlsx
   - System credit/deposit from 1980

7. `load_casa_by_group()` - 20260106_CASA_Banks.xlsx
   - CASA by bank group from 2005

8. `load_asset_quality_annual()` - Banks_databook_AQ.xlsx
   - Slippage/recovery/writeoff ratios, advances/branch

**Step 1:** Implement all sub-loaders
**Step 2:** Test each one individually
**Step 3:** Commit: "feat: supplementary data loaders (RBI, cards, rates, AQ)"

---

### Task 7: Derived Metrics Engine

**Files:**
- Create: `data/metrics.py`

**Purpose:** Compute DuPont decomposition and novel metrics from raw data.

**DuPont tree metrics (computed from quarterly/annual data):**
```python
# Level 1
RoE = PAT / Avg_Equity (annualized for quarterly)
# Level 2
RoA = PAT / Avg_Assets
Equity_Multiplier = Avg_Assets / Avg_Equity
# Level 3
NII_to_Assets = NII / Avg_Assets  (proxy for NIM contribution)
NonII_to_Assets = Non_Int_Inc / Avg_Assets
OpEx_to_Assets = OpEx / Avg_Assets
Credit_Cost = LLP / Avg_Assets  (or LLP / Avg_Loans)
Tax_Rate = Tax / PBT
# Level 4
Yield_Spread = Yield_on_Advances - Cost_of_Funds
Loan_Mix = Loans / Assets
CASA_Benefit = (CASA_ratio * cost_differential_proxy)
```

**Novel metrics:**
```python
CASA_per_branch = CASA / Branches
Advances_per_branch = Loans / Branches
Employee_per_branch = Employees / Branches
Fee_intensity = Fee_Income / Assets
Operating_leverage = Revenue_growth - OpEx_growth
Deposit_franchise_score = CASA_ratio * Deposit_growth * (1 / Cost_of_Deposits)
```

**Step 1:** Implement DuPont decomposition functions
**Step 2:** Implement novel metric calculations
**Step 3:** Test against known RoE values (validate vs "Top 4 Banks RoE Tree" in JP file)
**Step 4:** Commit: "feat: DuPont decomposition and derived metrics engine"

---

### Task 8: Master Data Loader with Caching

**Files:**
- Create: `data/loader.py` (orchestrator)

**Purpose:** Single entry point that loads all data and caches it.

```python
@st.cache_data(ttl=3600)
def load_all_data():
    mapping = get_bank_mapping()
    quarterly_metrics = load_quarterly_metrics()
    bank_quarterly = load_bank_quarterly_data()
    annual_metrics = load_annual_metrics()
    rbi_fortnightly = load_rbi_fortnightly()
    # ... etc
    derived = compute_all_derived_metrics(quarterly_metrics, bank_quarterly, annual_metrics)
    return {
        'mapping': mapping,
        'quarterly': quarterly_metrics,
        'bank_quarterly': bank_quarterly,
        'annual': annual_metrics,
        'derived': derived,
        'rbi_fortnightly': rbi_fortnightly,
        # ... etc
    }
```

**Step 1:** Implement orchestrator
**Step 2:** Test full load (may take 30-60 seconds for all files)
**Step 3:** Commit: "feat: master data loader with Streamlit caching"

---

## Phase 2: Dashboard Infrastructure

### Task 9: Global Sidebar & Filters

**Files:**
- Create: `components/sidebar.py`

**Purpose:** Shared sidebar across all pages with bank type, bank selection, period, and time range filters.

**Filters:**
- Bank Type: multiselect from [PSU, Large Private, Regional Private, SFB]
- Quick Presets: buttons for "Top 5 Private", "Top 5 PSU", "All"
- Bank Selection: multiselect of individual banks (filtered by type)
- Period: radio [Quarterly, Annual]
- Time Range: slider (start/end quarter or year)

**Step 1:** Implement sidebar.py with all filters returning a FilterState dataclass
**Step 2:** Integrate into app.py
**Step 3:** Commit: "feat: global sidebar with bank type and period filters"

---

### Task 10: Reusable Chart & Table Components

**Files:**
- Create: `components/charts.py`
- Create: `components/tables.py`

**Charts:**
- `waterfall_chart(data, title)` - for DuPont decomposition
- `line_chart(data, x, y, color, title)` - time series
- `stacked_bar(data, x, y, color, title)` - composition
- `heatmap_table(df, title)` - ratio screener with color coding
- `grouped_bar(data, x, y, color, title)` - cross-sectional comparison

**Tables:**
- `styled_table(df, format_dict)` - formatted dataframe with conditional coloring
- `ratio_heatmap(df)` - percentile-based coloring

**Step 1:** Implement chart components
**Step 2:** Implement table components
**Step 3:** Commit: "feat: reusable Plotly chart and table components"

---

## Phase 3: Dashboard Pages

### Task 11: Page 1 - DuPont / RoE Tree

**Files:**
- Create: `pages/1_DuPont_RoE_Tree.py`

**Two modes:**
1. **Cross-sectional:** Select a period -> see all filtered banks' RoE decomposition as a grouped waterfall
2. **Time-series:** Select one bank -> see its RoE decomposition evolving over time

**Charts:**
- Waterfall: RoE = NII/Assets + NonII/Assets - OpEx/Assets - CreditCost - Tax -> RoA, then RoA x Leverage = RoE
- Line chart: Each DuPont component over time
- Summary table: All components numerically

**Step 1:** Implement cross-sectional view with waterfall
**Step 2:** Implement time-series view with line charts
**Step 3:** Add quarterly/annual toggle
**Step 4:** Commit: "feat: Page 1 - DuPont RoE Tree with cross-section and time-series views"

---

### Task 12: Page 2 - Ratio Screener

**Files:**
- Create: `pages/2_Ratio_Screener.py`

**Features:**
- Select period -> table of all banks x all ratios
- Color-code by percentile (green = good, red = bad, context-dependent)
- Sortable by any column
- Metric groups: Profitability, Growth, Asset Quality, Balance Sheet, Capital, Liquidity

**Step 1:** Build the metric grouping and data assembly
**Step 2:** Implement heatmap table with conditional formatting
**Step 3:** Add download-to-Excel button
**Step 4:** Commit: "feat: Page 2 - Ratio Screener with heatmap coloring"

---

### Task 13: Page 3 - Bank Deep Dive

**Files:**
- Create: `pages/3_Bank_Deep_Dive.py`

**Single bank, all metrics over time:**
- P&L waterfall (current period)
- NII / Revenue / PPOP / PAT trends
- Yield / Cost / NIM evolution
- GNPA/NNPA trends + NPA flow (slippages, recovery, writeoffs)
- Deposit composition (CA/SA/TD stacked area)
- Loan book split (if available from JP data)
- Capital adequacy trend
- CASA/branch, advances/branch operational metrics

**Step 1:** Implement bank selector and P&L section
**Step 2:** Implement yield/cost and asset quality sections
**Step 3:** Implement deposit and balance sheet sections
**Step 4:** Implement loan book split section (for banks with data)
**Step 5:** Commit: "feat: Page 3 - Bank Deep Dive with full metric coverage"

---

### Task 14: Page 4 - Sector Analytics

**Files:**
- Create: `pages/4_Sector_Analytics.py`

**Views:**
- PSU vs Private vs SFB aggregate comparison (from consolidated sheets)
- Market share trends (deposits, credit, PAT)
- RBI fortnightly system-level trends (credit, deposits, CD ratio)
- System deposit composition over time
- Private vs PSU deposit share from FY94

**Step 1:** Implement group comparison section
**Step 2:** Implement RBI fortnightly trends
**Step 3:** Implement market share evolution
**Step 4:** Commit: "feat: Page 4 - Sector Analytics with group comparisons and RBI data"

---

### Task 15: Page 5 - Novel Metrics

**Files:**
- Create: `pages/5_Novel_Metrics.py`

**Metrics:**
- CASA/branch, Advances/branch, Employees/branch
- Fee income intensity
- Operating leverage (cumulative Revenue growth - OpEx growth)
- Credit cost vs Slippage ratio divergence
- Unsecured exposure % (from JP file)
- Branch vintage / age distribution
- Concentration risk (Top 20 depositors/borrowers)
- Deposit franchise score
- Credit card metrics: Cards/branch, Spends/card

**Step 1:** Implement franchise metrics section (CASA/branch, etc.)
**Step 2:** Implement risk/quality metrics section
**Step 3:** Implement branch vintage visualization
**Step 4:** Commit: "feat: Page 5 - Novel derived metrics for long-term analysis"

---

### Task 16: Page 6 - Credit Cards & Deposit Rates

**Files:**
- Create: `pages/6_Cards_Rates.py`

**Credit Cards:**
- Cards in force trend by bank
- Market share pie/area chart
- POS vs E-commerce transaction split
- Average transaction size

**Deposit Rates:**
- SA rate tracker by bank and slab (over time)
- TD rate tracker by tenure
- Rate differential (Private vs PSU)

**Step 1:** Implement credit cards section
**Step 2:** Implement deposit rates section
**Step 3:** Commit: "feat: Page 6 - Credit Cards and Deposit Rates tracker"

---

## Phase 4: Polish

### Task 17: Home Page & Navigation

**Files:**
- Modify: `app.py`

**Step 1:** Add a home page with dashboard overview, key highlights, and navigation
**Step 2:** Add page icons and clean formatting
**Step 3:** Commit: "feat: home page with dashboard overview"

---

### Task 18: Performance & Error Handling

**Step 1:** Add loading spinners for heavy computations
**Step 2:** Add graceful handling for missing data (some banks don't have all metrics)
**Step 3:** Add data freshness indicator (last updated date)
**Step 4:** Commit: "fix: performance optimization and error handling"
