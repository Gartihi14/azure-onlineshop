document.addEventListener('DOMContentLoaded', loadProducts);

// Simulierte Produktdaten mit Blob Storage URLs
const placeholderProducts = [
    {
        id: 1,
        name: "Ring aus Silber",
        description: "Ein eleganter Silberring",
        thumbnailUrl: "https://onlineshopstorage.blob.core.windows.net/product-thumbnails/silverring.jpg"
    },
    {
        id: 2,
        name: "Goldkette",
        description: "Fein gearbeitete Goldkette",
        thumbnailUrl: "https://onlineshopstorage.blob.core.windows.net/product-thumbnails/goldkette.jpg"
    },
    {
        id: 3,
        name: "Diamant-Ohrringe",
        description: "Hochwertige Diamant-Ohrringe",
        thumbnailUrl: "https://onlineshopstorage.blob.core.windows.net/product-thumbnails/ohrringe.jpg"
    }
];

async function loadProducts() {
    const productList = document.getElementById('product-list');
    productList.innerHTML = ''; // Leeren, falls schon etwas vorhanden ist

    // Lade Platzhalterprodukte in die Web-App
    placeholderProducts.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product';
        productElement.innerHTML = `
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <img src="${product.thumbnailUrl}" alt="${product.name}">
            <button onclick="placeOrder('${product.id}')">Bestellen</button>
        `;
        productList.appendChild(productElement);
    });
}

// Platzhalter-Funktion für Bestellungen (später API-Call einfügen)
async function placeOrder(productId) {
    alert(`Bestellung für Produkt ID ${productId} ausgelöst! (API noch nicht implementiert)`);

    // Platzhalter für späteren API-Call
    // await fetch('https://<aws-api-endpoint>/checkout', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({ productId })
    // });
}
