// Category descriptions for goods exports stacked area chart
const exportCategoryDescriptions = {
	"Meat and meat preparations": "Australia is a leading global exporter of high-quality beef, lamb, and other meat products. Major destinations include Japan, the United States, and China. Exports are supported by strong animal welfare, traceability, and biosecurity standards.",
	"Cereal grains": "Includes wheat, barley, and other coarse grains. Australia is one of the world's top wheat exporters, supplying key markets across Asia and the Middle East. Exports fluctuate with seasonal yields and global commodity prices.",
	"Wool and sheepskins": "Renowned for its Merino wool, Australia remains one of the largest suppliers to the global textile industry. China is the dominant destination for raw wool, where it is processed into garments and fabrics.",
	"Other rural": "Covers a diverse range of agricultural and processed food products such as dairy, wine, cotton, sugar, seafood, fruits, and vegetables. These items complement Australia’s major rural exports and support regional economies.",
	"Metal ores and minerals": "Led by iron ore exports to China, this category is Australia’s largest export by value. It also includes bauxite, alumina, copper, and other mineral ores critical for global manufacturing and infrastructure.",
	"Coal, coke and briquettes": "Comprises thermal coal for power generation and metallurgical coal for steelmaking. Coal remains one of Australia’s most valuable exports, primarily to Japan, South Korea, India, and China.",
	"Other mineral fuels": "Dominated by liquefied natural gas (LNG) exports, alongside crude petroleum and refined fuels. Australia is one of the world’s top LNG suppliers, with major buyers including Japan, China, and South Korea.",
	"Metals (excl. non-monetary gold)": "Includes refined metals such as aluminium, copper, zinc, and steel. These products represent value-added processing of Australia’s mineral resources for use in global manufacturing supply chains.",
	"Manufacturing": "Covers exports of machinery, transport equipment, pharmaceuticals, chemicals, plastics, and textiles. While smaller in share compared to resources, manufacturing exports demonstrate Australia’s industrial diversity and advanced production capabilities.",
	"Other non-rural": "Includes processed non-rural commodities such as sugar, beverages (including wine and beer), and other food and industrial products not captured in other categories."
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
function setupChartHover(view, descriptionBoxId, descriptions, fieldName = 'Industry') {
	const descriptionBox = document.getElementById(descriptionBoxId);
	if (!descriptionBox) {
		console.error('Description box not found:', descriptionBoxId);
		return;
	}

	// Listen to mouseover on the mark
	view.addEventListener('mouseover', function(event, item) {
		if (item && item.datum) {
			const category = item.datum[fieldName];
			if (category) {
				const description = descriptions[category] || "Detailed information about this category.";
				descriptionBox.innerHTML = `<strong>${category}</strong><br><br>${description}`;
				descriptionBox.style.display = 'block';
			}
		}
	});

	// Listen to mouseout
	view.addEventListener('mouseout', function(event, item) {
		descriptionBox.style.display = 'none';
	});
}

// Make function globally available
window.setupChartHover = setupChartHover;
window.exportCategoryDescriptions = exportCategoryDescriptions;
window.importerDescriptions = importerDescriptions;

