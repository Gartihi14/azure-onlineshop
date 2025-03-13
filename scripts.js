document.addEventListener('DOMContentLoaded', loadProducts);

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
    productList.innerHTML = '';

    placeholderProducts.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product';
        productElement.innerHTML = `
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <img src="${product.thumbnailUrl}" alt="${product.name}">
            
            <div class="quantity-controls">
                <button onclick="changeQuantity('${product.id}', -1)">-</button>
                <span id="quantity-${product.id}">1</span>
                <button onclick="changeQuantity('${product.id}', 1)">+</button>
            </div>

            <button onclick="placeOrder('${product.id}', '${product.name}')">Bestellen</button>
        `;
        productList.appendChild(productElement);
    });
}

function changeQuantity(productId, change) {
    const quantityElement = document.getElementById(`quantity-${productId}`);
    let currentQuantity = parseInt(quantityElement.innerText);
    currentQuantity = Math.max(1, currentQuantity + change); // Mindestmenge 1
    quantityElement.innerText = currentQuantity;
}

async function placeOrder(productId, productName) {
    const quantity = parseInt(document.getElementById(`quantity-${productId}`).innerText);

    try {
        // ✅ 1. Lagerstand prüfen (Platzhalter für AWS API)
        const inventoryResponse = await fetch(`https://<aws-api-endpoint>/inventory/${productId}`);
        const inventoryData = await inventoryResponse.json();

        if (inventoryData.available >= quantity) {
            // ✅ 2. Bestellung auslösen (Platzhalter für Checkout API)
            await fetch('https://<aws-api-endpoint>/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productId, quantity })
            });

            // ✅ 3. SMS über Azure Function versenden
            await fetch('https://<your-function-app>.azurewebsites.net/api/SendSms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-functions-key': '<your-function-key>'
                },
                body: JSON.stringify({
                    to: "+491234567890",
                    message: `Bestellung erfolgreich: ${productName} - Menge: ${quantity}`
                })
            });

            // ✅ 4. Erfolgsmeldung anzeigen
            alert(`Bestellung für ${productName} erfolgreich. Menge: ${quantity}`);
        } else {
            // 🚨 Lagerstand zu niedrig!
            alert(`Lagerstand zu niedrig für ${productName}! Verfügbar: ${inventoryData.available}`);
        }

    } catch (error) {
        console.error('Fehler bei der Bestellung:', error);
        alert('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    }
}
