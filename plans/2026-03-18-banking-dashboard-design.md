# Banking Dashboard Design

## Overview
Multi-page Streamlit dashboard for Indian banking sector analysis, targeting investment analysts who think about banks from a long-term, franchise-quality perspective.

## Data Sources (9 Excel files)

| File | Key Content | Granularity | Period |
|------|-------------|-------------|--------|
| Banks_dashboard_quarterly.xlsx | 73 sheets, full P&L/BS/ratios | Quarterly, 42 banks | FY07-FY26 |
| Banks_databook.xlsx | 91 sheets, annual databook + estimates | Annual, 40 banks | FY01-FY28E |
| Banks_quarterly database.xlsx | 61 sheets, individual bank financials | Quarterly, 42+8 groups | FY05-FY26 |
| Banks_databook_AQ.xlsx | 21 sheets, asset quality deep-dive | Annual, ~20 banks | FY08-FY28E |
| 20260204_Final_Liabilities_Advances_JP.xlsx | RBI fortnightly, loan splits, RoE tree, branch vintage | Mixed | FY05-FY26 |
| 20240109_System_Credit_Deposit_Data.xlsx | System credit/deposit | Annual | 1980-2025 |
| 20260106_CASA_Banks.xlsx | CASA by bank group | Annual | 2005-2025 |
| Bank deposits rates.xlsx | SA/TD rates, 135 snapshots | ~Biweekly | 2020-2026 |
| Credit cards.xlsm | Card volumes/values/market share | Monthly | 2012-2026 |

## Dashboard Pages

### Page 1: DuPont / RoE Tree
**Purpose:** Decompose what drives bank profitability

**RoE Decomposition:**
```
RoE = RoA x Equity Multiplier (Assets/Equity)
RoA = NII/Assets + Non-II/Assets - OpEx/Assets - Credit Cost - Tax/Assets
NII/Assets = NIM proxy = (Yield on Assets - Cost of Funds) x (Earning Assets/Total Assets)
```

**Views:**
- Cross-sectional: All banks side-by-side for a selected period (waterfall chart)
- Time-series: One bank's RoE tree evolution over time (stacked area / line)
- Period: Quarterly or Annual toggle
- Validate against pre-built "Top 4 Banks RoE Tree" sheet from JP file

### Page 2: Financial Snapshot / Ratio Screener
**Purpose:** Compare all banks on all metrics at a point in time

**Metrics (grouped):**
- Profitability: RoE, RoA, NIM, Cost-Income, PPOP/Assets, RoRWA
- Growth: NII growth, Revenue growth, PAT growth, Loan growth, Deposit growth
- Asset Quality: GNPA%, NNPA%, Slippage ratio, Credit cost, PCR
- Balance Sheet: CASA%, CD Ratio, Loans/Assets, Borrowings/Assets
- Capital: CET1, Tier-1, CAR, RWA density
- Liquidity: LCR
- Valuation: EPS, BVPS, ABVPS, PPoP/share

**Display:** Sortable table + heatmap (percentile-colored)

### Page 3: Bank Deep Dive (Time-Series)
**Purpose:** Single-bank longitudinal analysis

**Sections:**
- P&L waterfall (NII -> Revenue -> PPOP -> PBT -> PAT)
- Balance sheet composition (stacked bar)
- Yield/Cost trends (Yield on advances, CoF, NIM, CoD, Cost of SA/TD)
- Asset quality trends (GNPA/NNPA, slippage/recovery/writeoff flows)
- Deposit mix (CA, SA, TD stacked area + CASA%)
- Loan book split by segment (for banks with data)
- Capital adequacy trend
- Operational (branches, employees, CASA/branch, advances/branch)

### Page 4: Sector & Group Analytics
**Purpose:** Compare bank groups and track market share

**Views:**
- PSU vs Private vs SFB aggregate trends
- Market share evolution (deposits, credit, PAT contribution)
- Consolidated group financials from pre-built group sheets
- RBI fortnightly system-level credit/deposit/CD ratio trends
- System deposit composition (CA/SA/TD) over time
- Private vs PSU deposit share from FY94

### Page 5: Novel / Derived Metrics
**Purpose:** Differentiated analytical views for long-term investors

**Metrics:**
- CASA per branch (deposit franchise strength per distribution point)
- Advances per branch (lending intensity)
- SA per customer, SA per branch
- Fee income intensity (Fee/Assets, Fee/Revenue)
- Operating leverage (Revenue growth - OpEx growth, cumulative)
- Credit cost vs Gross slippage divergence (provisioning aggressiveness)
- Unsecured exposure % across banks
- Branch vintage / age distribution (network maturity)
- Concentration risk (Top 20 depositors/borrowers %)
- Deposit franchise score = CASA% x Deposit growth x (1/Cost of Deposits)
- Re-pricing bucket analysis (rate sensitivity)
- Credit card metrics: Cards/branch, Spends/card, ENR/card

### Page 6: Credit Cards & Deposit Rates
**Purpose:** Track payments franchise and liability pricing

**Credit Cards:**
- Cards in force by bank (time series)
- Market share trends
- POS vs E-commerce split
- Average transaction size trends
- Credit card spends/card/year

**Deposit Rates:**
- SA rate tracker by bank and slab
- TD rate tracker by tenure
- Rate vs deposit growth correlation
- Rate differential (Private vs PSU)

## Global Filters (Sidebar)

**Bank Type Filter:**
- All Banks
- PSU Banks
- Large Private Banks (HDFC, ICICI, Axis, Kotak, IndusInd)
- Regional Private Banks (Federal, City Union, KVB, SIB, J&K, Karnataka)
- Small Finance Banks (AU, Equitas, Ujjivan, Bandhan)

**Quick Presets:**
- Top 5 Private (HDFCB, ICICIBC, AXSB, KMB, IIB)
- Top 5 PSU (SBIN, BOB, PNB, CBK, UNBK)
- Top 10 by Assets
- Custom selection (multi-select)

**Period Controls:**
- Quarterly / Annual toggle
- Time range slider (start quarter/year to end)

## Data Pipeline

1. Parse all 9 Excel files with pandas/openpyxl
2. Normalize bank names across files (mapping table)
3. Classify banks by type using Mapping sheet (handles mergers)
4. Compute derived metrics
5. Store in structured format (Parquet or in-memory DataFrames)
6. Cache with Streamlit `@st.cache_data`

## Tech Stack
- Python 3.11+
- Streamlit (dashboard framework)
- Pandas (data processing)
- Plotly (interactive charts)
- Openpyxl (Excel parsing)

## File Structure
```
Banking Dashboard App/
├── app.py                    # Main Streamlit entry point
├── pages/
│   ├── 1_DuPont_RoE_Tree.py
│   ├── 2_Ratio_Screener.py
│   ├── 3_Bank_Deep_Dive.py
│   ├── 4_Sector_Analytics.py
│   ├── 5_Novel_Metrics.py
│   └── 6_Cards_Rates.py
├── data/
│   ├── loader.py             # Excel parsing and normalization
│   ├── mappings.py           # Bank name/type mappings
│   └── metrics.py            # Derived metric calculations
├── components/
│   ├── sidebar.py            # Global filter sidebar
│   ├── charts.py             # Reusable chart components
│   └── tables.py             # Reusable table components
├── requirements.txt
├── docs/plans/
│   └── 2026-03-18-banking-dashboard-design.md
└── [Excel data files]
```
