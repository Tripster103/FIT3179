import pandas as pd
import json
import re

# Country coordinates (latitude, longitude for country centroids)
COUNTRY_COORDS = {
    'Australia': {'lat': -25.2744, 'lon': 133.7751},
    'China': {'lat': 35.8617, 'lon': 104.1954},
    'Japan': {'lat': 36.2048, 'lon': 138.2529},
    'South Korea': {'lat': 35.9078, 'lon': 127.7669},
    'United States': {'lat': 37.0902, 'lon': -95.7129},
    'India': {'lat': 20.5937, 'lon': 78.9629},
    'Thailand': {'lat': 15.8700, 'lon': 100.9925},
    'Taiwan': {'lat': 23.6978, 'lon': 120.9605},
    'New Zealand': {'lat': -40.9006, 'lon': 174.8860},
    'Malaysia': {'lat': 4.2105, 'lon': 101.9758},
    'Singapore': {'lat': 1.3521, 'lon': 103.8198},
    'United Kingdom': {'lat': 55.3781, 'lon': -3.4360},
    'Germany': {'lat': 51.1657, 'lon': 10.4515},
    'Vietnam': {'lat': 14.0583, 'lon': 108.2772},
    'Indonesia': {'lat': -0.7893, 'lon': 113.9213},
    'Hong Kong': {'lat': 22.3193, 'lon': 114.1694},
    'Canada': {'lat': 56.1304, 'lon': -106.3468},
    'France': {'lat': 46.2276, 'lon': 2.2137},
    'Italy': {'lat': 41.8719, 'lon': 12.5674},
    'Netherlands': {'lat': 52.1326, 'lon': 5.2913},
    'Belgium': {'lat': 50.5039, 'lon': 4.4699},
    'Spain': {'lat': 40.4637, 'lon': -3.7492},
    'Switzerland': {'lat': 46.8182, 'lon': 8.2275},
    'Brazil': {'lat': -14.2350, 'lon': -51.9253},
    'Mexico': {'lat': 23.6345, 'lon': -102.5528},
    'Saudi Arabia': {'lat': 23.8859, 'lon': 45.0792},
    'United Arab Emirates': {'lat': 23.4241, 'lon': 53.8478},
    'Philippines': {'lat': 12.8797, 'lon': 121.7740},
    'Papua New Guinea': {'lat': -6.3150, 'lon': 143.9555},
    'Fiji': {'lat': -17.7134, 'lon': 178.0650},
    'Bangladesh': {'lat': 23.6850, 'lon': 90.3563},
    'Pakistan': {'lat': 30.3753, 'lon': 69.3451},
    'Chile': {'lat': -35.6751, 'lon': -71.5430},
    'Peru': {'lat': -9.1900, 'lon': -75.0152},
    'South Africa': {'lat': -30.5595, 'lon': 22.9375},
    'Israel': {'lat': 31.0461, 'lon': 34.8516},
    'Poland': {'lat': 51.9194, 'lon': 19.1451},
    'Turkey': {'lat': 38.9637, 'lon': 35.2433},
    'Russia': {'lat': 61.5240, 'lon': 105.3188},
    'Argentina': {'lat': -38.4161, 'lon': -63.6167},
    'Colombia': {'lat': 4.5709, 'lon': -74.2973},
    'Egypt': {'lat': 26.8206, 'lon': 30.8025},
    'Kenya': {'lat': -0.0236, 'lon': 37.9062},
    'Nigeria': {'lat': 9.0820, 'lon': 8.6753},
    'Oman': {'lat': 21.4735, 'lon': 55.9754},
    'Qatar': {'lat': 25.3548, 'lon': 51.1839},
    'Bahrain': {'lat': 26.0667, 'lon': 50.5577},
    'Kuwait': {'lat': 29.3117, 'lon': 47.4818},
}

print("="*70)
print("Converting CSV files to JSON (Values in $Billions)")
print("="*70)

def parse_period_to_year(period_str):
    """Extract year from period string like 'July 2018 to December 2018'"""
    if pd.isna(period_str):
        return None
    # Get the last year mentioned
    years = re.findall(r'\d{4}', str(period_str))
    if years:
        return int(years[-1])
    return None

def normalize_country_name(country):
    """Normalize country names to match coordinates"""
    name_mapping = {
        'Korea, Republic of (South)': 'South Korea',
        'United States of America': 'United States',
        'Hong Kong (SAR of China)': 'Hong Kong',
        'Viet Nam': 'Vietnam',
        'China (excludes SARs and Taiwan)': 'China',
        'United Kingdom (c)': 'United Kingdom',
    }
    country = str(country).strip()
    return name_mapping.get(country, country)

def extract_from_csv(csv_path, flow_type):
    """Extract trade data from CSV and convert millions to billions"""
    df = pd.read_csv(csv_path, header=None)
    
    # Row 8 (index 7) has period headers
    header_row = 7
    data_start_row = 8
    country_col = 0
    data_start_col = 1
    
    # Extract period headers and years
    periods = []
    for col_idx in range(data_start_col, df.shape[1]):
        period = df.iloc[header_row, col_idx]
        year = parse_period_to_year(period)
        if year:
            periods.append((col_idx, year))
    
    print(f"\n{flow_type.upper()}: Found {len(periods)} periods from {periods[0][1]} to {periods[-1][1]}")
    
    # Extract country data
    yearly_data = {}
    for row_idx in range(data_start_row, len(df)):
        country = df.iloc[row_idx, country_col]
        
        if pd.isna(country) or country == '':
            continue
        
        country = normalize_country_name(country)
        
        # Skip totals and unknown countries
        if 'Total' in str(country) or 'All Countries' in str(country):
            continue
        
        # Extract values for each period and aggregate by year
        for col_idx, year in periods:
            value = df.iloc[row_idx, col_idx]
            
            if pd.isna(value) or value == 'np' or value == '':
                continue
            
            try:
                value = float(value)
                if value > 0:
                    # Aggregate by country-year
                    key = (country, year)
                    if key not in yearly_data:
                        yearly_data[key] = 0
                    yearly_data[key] += value
            except (ValueError, TypeError):
                continue
    
    # Convert to list and convert millions to billions
    # ONLY INCLUDE FLOWS >= $5B AND YEARS 2019-2024
    results = []
    for (country, year), value_millions in yearly_data.items():
        value_billions = round(value_millions / 1000, 2)  # Convert $M to $B
        if value_billions >= 5 and year >= 2019:  # Filter for $5B or above and 2019+
            results.append({
                'country': country,
                'year': year,
                'value': value_billions
            })
    
    results.sort(key=lambda x: (x['year'], x['country']))
    
    unique_countries = len(set(r['country'] for r in results))
    print(f"  Extracted {len(results)} records for {unique_countries} countries")
    return results

# Extract exports data
print("\nProcessing EXPORTS...")
exports_data = extract_from_csv('data/merch_exports_raw.csv', 'exports')

# Extract imports data
print("\nProcessing IMPORTS...")
imports_data = extract_from_csv('data/merch_imports_raw.csv', 'imports')

print("\n" + "="*70)
print("Creating flow line JSON files")
print("="*70)

def create_flow_lines(trade_data, flow_type):
    """Create flow lines with coordinates"""
    flow_lines = []
    aus_coords = COUNTRY_COORDS['Australia']
    missing_coords = set()
    
    for record in trade_data:
        country = record['country']
        year = record['year']
        value = record['value']
        
        if country not in COUNTRY_COORDS:
            missing_coords.add(country)
            continue
        
        if country == 'Australia':
            continue
        
        coords = COUNTRY_COORDS[country]
        
        if flow_type == 'exports':
            flow_line = {
                'country': country,
                'year': year,
                'value': value,
                'origin_lon': aus_coords['lon'],
                'origin_lat': aus_coords['lat'],
                'dest_lon': coords['lon'],
                'dest_lat': coords['lat']
            }
        else:  # imports
            flow_line = {
                'country': country,
                'year': year,
                'value': value,
                'origin_lon': coords['lon'],
                'origin_lat': coords['lat'],
                'dest_lon': aus_coords['lon'],
                'dest_lat': aus_coords['lat']
            }
        
        flow_lines.append(flow_line)
    
    return flow_lines, missing_coords

# Create exports flow lines
print("\nCreating EXPORTS flow lines...")
exports_flow_lines, missing_exports = create_flow_lines(exports_data, 'exports')
output_file = 'data/NEW_flow_lines_exports.json'
with open(output_file, 'w') as f:
    json.dump(exports_flow_lines, f, indent=2)

countries = sorted(set(item['country'] for item in exports_flow_lines))
years = sorted(set(item['year'] for item in exports_flow_lines))
print(f"✓ Saved: {output_file}")
print(f"  - {len(exports_flow_lines)} flow lines")
print(f"  - {len(countries)} countries: {', '.join(countries[:5])}...")
print(f"  - Years: {years[0]} to {years[-1]}")

# Create imports flow lines
print("\nCreating IMPORTS flow lines...")
imports_flow_lines, missing_imports = create_flow_lines(imports_data, 'imports')
output_file = 'data/NEW_flow_lines_imports.json'
with open(output_file, 'w') as f:
    json.dump(imports_flow_lines, f, indent=2)

countries = sorted(set(item['country'] for item in imports_flow_lines))
years = sorted(set(item['year'] for item in imports_flow_lines))
print(f"✓ Saved: {output_file}")
print(f"  - {len(imports_flow_lines)} flow lines")
print(f"  - {len(countries)} countries: {', '.join(countries[:5])}...")
print(f"  - Years: {years[0]} to {years[-1]}")

# Report missing coordinates
all_missing = missing_exports | missing_imports
if all_missing:
    print("\n" + "="*70)
    print(f"⚠ WARNING: {len(all_missing)} countries missing coordinates:")
    for country in sorted(all_missing):
        print(f"  - {country}")
    print("\nAdd these to COUNTRY_COORDS if needed")
else:
    print("\n✓ All countries have coordinates!")

print("\n" + "="*70)
print("DONE! Created NEW JSON files with values in $Billions")
print("  - data/NEW_flow_lines_exports.json")
print("  - data/NEW_flow_lines_imports.json")
print("="*70)
