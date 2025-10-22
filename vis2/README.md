# Australia's International Trade Visualization

A data visualization project exploring Australia's international trade dynamics with its top trading partners.

## Project Structure

```
vis2/
├── index.html                          # Main visualization page
├── css/
│   └── styles.css                      # Styling for the visualization
├── specs/
│   ├── flow_map.vg.json               # Flow map Vega-Lite spec
│   ├── exporters_bar_chart.vg.json    # Exporters bar chart spec
│   ├── importers_bar_chart.vg.json    # Importers bar chart spec
│   └── ne_110m_admin_0_countries.topojson  # World map topology
├── scripts/
│   ├── chart_interactions.js           # Interactive chart behaviors (JavaScript)
│   ├── flow_map_controller.js          # Flow map controller (JavaScript)
│   ├── convert_csv_to_json.py          # Step 1: Convert raw CSV to straight-line flow JSON
│   └── make_curved_flows_clip_topo.py  # Step 2: Generate curved flows with map clipping
└── data/
    ├── merch_exports_raw.csv           # Raw export data (source)
    ├── merch_imports_raw.csv           # Raw import data (source)
    ├── NEW_flow_lines_exports.json     # Generated curved export flows
    ├── NEW_flow_lines_imports.json     # Generated curved import flows
    ├── Number of merchandise exporters, by industry of exporter.csv
    └── Number of business importers and value, by industry of importer 2020-21.csv
```

## Data Processing Workflow

### Step 1: Convert CSV to Straight-Line Flows
```bash
python scripts/convert_csv_to_json.py
```
- Reads raw CSV files from `data/`
- Filters trade flows >= $5B for years 2019-2024
- Creates straight-line origin-destination flows
- Outputs: `NEW_flow_lines_exports.json` and `NEW_flow_lines_imports.json`

### Step 2: Generate Curved Flows with Boundary Clipping
```bash
python scripts/make_curved_flows_clip_topo.py
```
- Reads straight-line flows from Step 1
- Extracts map boundaries from TopoJSON
- Generates spherical Bézier curves for each flow
- **Special handling for trans-Pacific routes**: Forces Australia ↔ USA routes to travel westward through Africa (avoiding map boundary at ±180°)
- Clips flow segments to map boundaries using Cohen-Sutherland algorithm
- Overwrites JSON files with curved, clipped segments

### Step 3: View Visualization
Open `index.html` in a web browser to view the interactive visualization.

## Key Features

### Curved Flow Routing
- **Trans-Pacific routes** (Australia ↔ USA) are routed **westward** through Asia, Africa, and the Atlantic
- This ensures flows **do not cross the map boundary** at ±180° longitude in the Pacific Ocean
- Waypoint at Europe (lon 10°) forces proper routing through Africa for both directions:
  - **Exports**: Australia (133°) → Asia → Africa (0-50°) → Atlantic → USA (-95°)
  - **Imports**: USA (-95°) → Atlantic → Africa (0-50°) → Asia → Australia (133°)

### Boundary Clipping
- Extended bbox: `-360° to 270°` longitude (allows westward wrapping)
- Cohen-Sutherland line clipping algorithm ensures flows stay within map boundaries
- Segments outside map are removed, inside segments are preserved

## Technologies Used

- **Python 3**: Data processing and curve generation
- **Vega-Lite**: Declarative visualization specifications
- **D3.js/TopoJSON**: Geographic data handling
- **NumPy**: Spherical geometry calculations (slerp, vector math)

## Notes

- Trade values are in **$Billions** (converted from millions in raw data)
- Only flows **≥ $5B** are included for clarity
- Years covered: **2019-2024**
- Curve height and direction are auto-assigned based on distance and sector crowding
