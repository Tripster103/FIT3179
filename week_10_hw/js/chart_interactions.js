// Industry descriptions for exporters
const exporterDescriptions = {
	"Agriculture forestry and fishing": "This sector includes businesses involved in farming, forestry, fishing, and related support services. Australia exports significant agricultural products including wheat, beef, wool, and seafood to global markets.",
	"Mining": "Mining exporters extract and export Australia's abundant natural resources including coal, iron ore, gold, and natural gas. This sector is crucial to Australia's export economy.",
	"Manufacturing": "Manufacturing exporters produce finished goods ranging from processed foods to machinery and equipment for international markets.",
	"Construction": "Construction sector exporters provide building materials, prefabricated structures, and construction services to overseas markets.",
	"Wholesale trade": "Wholesale trade businesses act as intermediaries, purchasing goods in bulk and exporting them to international distributors and retailers.",
	"Retail trade": "Retail exporters sell Australian products directly to overseas consumers, often through e-commerce platforms and international store locations.",
	"Transport postal and warehousing": "This sector includes logistics companies, freight forwarders, and warehousing services that facilitate the movement of goods internationally.",
	"Other": "Includes exporters from diverse sectors such as professional services, technology, education services, healthcare products, and cultural goods."
};

// Industry descriptions for importers
const importerDescriptions = {
	"Mining": "Mining companies import specialized equipment, machinery, and technology needed for resource extraction operations.",
	"Manufacturing": "Manufacturers import raw materials, components, machinery, and intermediate goods for production processes.",
	"Construction": "Construction businesses import building materials, heavy equipment, tools, and specialized construction technology.",
	"Wholesale trade": "Wholesale importers bring in large quantities of goods from overseas suppliers to distribute throughout the Australian market.",
	"Retail trade": "Retailers import consumer goods, clothing, electronics, and other products for sale to Australian consumers.",
	"Professional scientific and technical services": "This sector imports specialized equipment, software, scientific instruments, and technical components.",
	"Other": "Includes importers across various sectors such as hospitality, telecommunications, financial services, healthcare, education, and entertainment."
};

// Function to setup hover on Vega chart using the view's event system
function setupChartHover(view, descriptionBoxId, descriptions) {
	const descriptionBox = document.getElementById(descriptionBoxId);
	if (!descriptionBox) {
		console.error('Description box not found:', descriptionBoxId);
		return;
	}

	// Listen to mouseover on the mark
	view.addEventListener('mouseover', function(event, item) {
		if (item && item.datum && item.datum.Industry) {
			const industry = item.datum.Industry;
			const description = descriptions[industry] || "Detailed information about this industry sector.";
			descriptionBox.innerHTML = `<strong>${industry}</strong><br><br>${description}`;
			descriptionBox.style.display = 'block';
		}
	});

	// Listen to mouseout
	view.addEventListener('mouseout', function(event, item) {
		descriptionBox.style.display = 'none';
	});
}

// Make function globally available
window.setupChartHover = setupChartHover;
window.exporterDescriptions = exporterDescriptions;
window.importerDescriptions = importerDescriptions;

