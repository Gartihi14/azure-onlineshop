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

            <button onclick="placeOrder('${product.id}')">Bestellen</button>
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

async function placeOrder(productId) {
    const quantity = document.getElementById(`quantity-${productId}`).innerText;

    alert(`Bestellung ausgelöst! Produkt ID: ${productId}, Menge: ${quantity}`);
    
    // Hier kann später der API-Call erfolgen:
    // await fetch('https://<aws-api-endpoint>/checkout', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({ productId, quantity })
    // });
}
