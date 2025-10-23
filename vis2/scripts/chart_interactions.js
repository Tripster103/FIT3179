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


// Category descriptions for goods imports stacked area chart
const importCategoryDescriptions = {
	"Food and beverages": "Consumer and industrial food and beverage imports including processed foods, snacks, beverages, confectionery, specialty ingredients, industrial food inputs, and raw materials for food manufacturing. Major sources include New Zealand, Thailand, and the United States.",
	"Non-industrial transport equipment": "Primarily passenger vehicles, motorcycles, and recreational vehicles. Japan, Thailand, Germany, and South Korea are major suppliers of cars and automotive products to Australia.",
	"Textiles, clothing and footwear": "Clothing, shoes, fabrics, raw textiles, yarns, and fashion accessories sourced predominantly from China, Bangladesh, Vietnam, and Indonesia. This category reflects Australia's reliance on low-cost manufacturing hubs.",
	"Consumer goods": "Miscellaneous consumer goods including household electrical items, toys, books, leisure goods, furniture, personal care items, watches, jewelry, and other household products.",
	"Machinery and industrial equipment": "Heavy machinery, industrial tools, manufacturing equipment, and specialized production systems. Imports support Australia's mining, agriculture, construction, and manufacturing sectors.",
	"Computers and data equipment": "Automatic Data Processing (ADP) equipment including computers, servers, data storage systems, and related hardware. Major suppliers include China, the United States, and Taiwan.",
	"Telecommunications equipment": "Mobile phones, networking hardware, communication devices, and infrastructure equipment. China, the United States, and South Korea are key sources.",
	"Industrial transport equipment": "Industrial vehicles, commercial trucks, construction equipment, and specialized transport machinery.",
	"Processed industrial supplies": "Manufactured intermediate goods and processed materials used as inputs for further production, including chemicals, plastics, iron and steel, paper, and other industrial materials.",
	"Fuels and lubricants": "Refined petroleum products, diesel, petrol, aviation fuel, and industrial lubricants. Despite Australia's resource wealth, refined fuel is heavily imported, mainly from Singapore and South Korea.",
	"Parts and components": "Automotive parts, aircraft components, computer components, and spare parts for vehicles, machinery, and capital equipment. Essential for repair, maintenance, and local assembly operations.",
	"Other": "All other imported goods including civil aircraft, capital goods, primary industrial supplies, and miscellaneous manufactured items not classified in the main categories."
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
window.importCategoryDescriptions = importCategoryDescriptions;
window.importerDescriptions = importerDescriptions;

