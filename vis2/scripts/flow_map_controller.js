// Flow Map Controller: Handles dynamic country highlighting based on trade value slider

var flowMapView = null;
var exportsData = null;
var importsData = null;

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
		
		return result;
	});
}
