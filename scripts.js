document.addEventListener('DOMContentLoaded', loadProducts);

const placeholderProducts = [
    {
        id: "1",
        name: "Ring aus Silber",
        description: "Ein eleganter Silberring",
        thumbnailUrl: "https://onlineshopstorage.blob.core.windows.net/product-thumbnails/silverring.jpg"
    },
    {
        id: "2",
        name: "Goldkette",
        description: "Fein gearbeitete Goldkette",
        thumbnailUrl: "https://onlineshopstorage.blob.core.windows.net/product-thumbnails/goldkette.jpg"
    },
    {
        id: "3",
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
        const response = await fetch("https://onlineshop-sms-func.azurewebsites.net/api/checkout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-functions-key": "JZVXPEM2gp9wb0nDzURhrjeME8kGLYhWM23h-I_CHThkAzFu1OTmqA=="
            },
            body: JSON.stringify({
                productId: productId,
                quantity: quantity
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.body);
        } else {
            alert("Fehler: " + data.body);
        }
    } catch (error) {
        console.error('Fehler bei der Bestellung:', error);
        alert('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    }
}
