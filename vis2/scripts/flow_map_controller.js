// Flow Map Controller: Handles dynamic country highlighting based on trade value slider

var flowMapView = null;
var exportsData = null;
var importsData = null;

// Country trade descriptions
const countryTradeDescriptions = {
	"China": {
		exports: "Australia's largest export destination. Major exports include iron ore, coal, natural gas (LNG), wool, and agricultural products like beef and wine.",
		imports: "Australia's largest source of imports. Major imports include manufactured goods, electronics, telecommunications equipment, textiles, clothing, furniture, and machinery."
	},
	"Japan": {
		exports: "Key export destination for energy and resources. Major exports include coal (both thermal and metallurgical), iron ore, natural gas (LNG), beef, and wheat.",
		imports: "Important source of vehicles and machinery. Major imports include passenger vehicles, machinery, electrical equipment, and refined petroleum products."
	},
	"South Korea": {
		exports: "Significant importer of Australian resources. Major exports include coal, iron ore, natural gas (LNG), alumina, and beef.",
		imports: "Major supplier of vehicles and electronics. Key imports include passenger vehicles, refined petroleum, machinery, and telecommunications equipment."
	},
	"United States": {
		exports: "Important market for Australian beef and resources. Major exports include beef, wine, pharmaceuticals, and refined metals.",
		imports: "Major source of technology and machinery. Key imports include aircraft, machinery, computer equipment, pharmaceuticals, and vehicles."
	},
	"India": {
		exports: "Growing market for Australian resources. Major exports include coal, copper ores, gold, vegetables, and education services.",
		imports: "Supplier of refined fuels and textiles. Major imports include refined petroleum products, pharmaceuticals, textiles, and jewelry."
	},
	"United Kingdom": {
		exports: "Historic trading partner. Major exports include beverages (wine), gold, meat, and education services.",
		imports: "Source of vehicles and pharmaceuticals. Major imports include vehicles, medicaments, beverages, and machinery."
	},
	"New Zealand": {
		exports: "Close regional partner. Major exports include crude petroleum, vehicles, pharmaceuticals, and machinery.",
		imports: "Major food supplier. Key imports include dairy products, meat, food preparations, wood products, and wine."
	},
	"Singapore": {
		exports: "Important regional hub. Major exports include crude petroleum, gold, meat, and cereals.",
		imports: "Key source of refined fuels. Major imports include refined petroleum products, telecommunications equipment, and pharmaceuticals."
	},
	"Thailand": {
		exports: "Growing Asian market. Major exports include crude petroleum, coal, wheat, and machinery.",
		imports: "Source of vehicles and food. Major imports include passenger vehicles, food preparations, machinery, and electrical equipment."
	},
	"Germany": {
		exports: "European market for resources. Major exports include coal, gold, medicaments, and meat.",
		imports: "Premium vehicle supplier. Major imports include passenger vehicles, machinery, pharmaceuticals, and aircraft parts."
	},
	"Taiwan": {
		exports: "Important destination for resources. Major exports include coal, iron ore, natural gas, and aluminum.",
		imports: "Technology supplier. Major imports include computer equipment, machinery, refined petroleum, and electronics."
	},
	"Vietnam": {
		exports: "Emerging market. Major exports include wheat, cotton, coal, and machinery.",
		imports: "Manufacturing hub supplier. Major imports include clothing, footwear, furniture, telecommunications equipment, and electrical machinery."
	},
	"Malaysia": {
		exports: "Regional trading partner. Major exports include crude petroleum, wheat, aluminum, and machinery.",
		imports: "Source of refined fuels and electronics. Major imports include refined petroleum, computer equipment, and telecommunications devices."
	},
	"Indonesia": {
		exports: "Neighboring market. Major exports include wheat, crude petroleum, live animals, and machinery.",
		imports: "Supplier of refined fuels. Major imports include refined petroleum products, furniture, footwear, and food preparations."
	},
	"Hong Kong": {
		exports: "Financial and trade hub. Major exports include gold, pearls, meat, and wine.",
		imports: "Re-export center. Major imports include telecommunications equipment, electrical machinery, and clothing."
	},
	"United Arab Emirates": {
		exports: "Middle Eastern hub. Major exports include gold, aluminum, meat, and cereals.",
		imports: "Source of crude petroleum and refined products. Major imports include crude petroleum, refined petroleum, and gold."
	},
	"Netherlands": {
		exports: "European gateway. Major exports include meat, medicaments, gold, and wine.",
		imports: "Re-export hub. Major imports include medicaments, machinery, and food preparations."
	}
};

// Function to get qualifying countries based on current parameters
function getQualifyingCountries(year, flowType, minValue) {
	const data = flowType === 'exports' ? exportsData : importsData;
	const countries = new Set();
	
	// Group by country and get max value for each (since data has multiple segments)
	const countryValues = {};
	data.forEach(d => {
		if (d.year === year) {
			if (!countryValues[d.country] || countryValues[d.country] < d.value) {
				countryValues[d.country] = d.value;
			}
		}
	});
	
	// Add countries that meet the threshold
	Object.keys(countryValues).forEach(country => {
		if (countryValues[country] >= minValue) {
			countries.add(country);
		}
	});
	
	return countries;
}

// Update country highlighting based on current parameter values
function updateCountryHighlighting() {
	if (!flowMapView) return;
	
	const year = flowMapView.signal('selectedYear');
	const flowType = flowMapView.signal('flowType');
	const minValue = flowMapView.signal('minTradeValue');
	
	const qualifyingCountries = getQualifyingCountries(year, flowType, minValue);
	
	// Store qualifying countries as a signal for the spec to use
	flowMapView.signal('qualifyingCountries', Array.from(qualifyingCountries));
	flowMapView.runAsync();
}

// Initialize flow map with dynamic country highlighting
function initializeFlowMap(spec) {
	// Load trade data for dynamic country filtering
	return Promise.all([
		fetch('data/NEW_flow_lines_exports.json').then(r => r.json()),
		fetch('data/NEW_flow_lines_imports.json').then(r => r.json()),
		vegaEmbed('#flow_map', spec, {"actions": false})
	]).then(function([exports, imports, result]) {
		flowMapView = result.view;
		exportsData = exports;
		importsData = imports;

		// Listen for parameter changes and update country highlighting
		flowMapView.addSignalListener('selectedYear', function(name, value) {
			updateCountryHighlighting();
		});
		
		flowMapView.addSignalListener('flowType', function(name, value) {
			updateCountryHighlighting();
		});
		
		flowMapView.addSignalListener('minTradeValue', function(name, value) {
			updateCountryHighlighting();
		});

		// Initial update
		updateCountryHighlighting();
		
		// Setup country hover tooltips
		setupCountryHoverTooltips(flowMapView);
		
		return result;
	});
}

// Setup hover tooltips for countries on the flow map
function setupCountryHoverTooltips(view) {
	// Create tooltip element if it doesn't exist
	let tooltip = document.getElementById('flow_map_country_tooltip');
	if (!tooltip) {
		tooltip = document.createElement('div');
		tooltip.id = 'flow_map_country_tooltip';
		tooltip.className = 'flow-map-tooltip';
		tooltip.style.display = 'none';
		document.body.appendChild(tooltip);
	}
	
	view.addEventListener('mouseover', function(event, item) {
		if (item && item.datum && item.datum.properties && item.datum.properties.NAME) {
			let countryName = item.datum.properties.NAME;
			
			// Don't show tooltip for Australia
			if (countryName === 'Australia') {
				tooltip.style.display = 'none';
				return;
			}
			
			// Map country names to match our descriptions
			const countryNameMap = {
				'United States of America': 'United States',
				'United Arab Emirates': 'United Arab Emirates'
			};
			
			const lookupName = countryNameMap[countryName] || countryName;
			const countryInfo = countryTradeDescriptions[lookupName];
			
			if (countryInfo) {
				const displayName = lookupName;
				const html = `
					<strong>${displayName}</strong><br><br>
					<strong><span style="color: #ff9500;">Exports</span> to ${displayName}:</strong><br>
					${countryInfo.exports}<br><br>
					<strong><span style="color: #3498db;">Imports</span> from ${displayName}:</strong><br>
					${countryInfo.imports}
				`;
				tooltip.innerHTML = html;
				tooltip.style.display = 'block';
				
				// Position tooltip at bottom-left relative to cursor
				const tooltipWidth = 400; // max-width from CSS
				const tooltipHeight = 200; // approximate
				tooltip.style.left = (event.clientX - tooltipWidth - 10) + 'px';
				tooltip.style.top = (event.clientY + 10) + 'px';
			}
		}
	});
	
	view.addEventListener('mouseout', function(event, item) {
		tooltip.style.display = 'none';
	});
}
