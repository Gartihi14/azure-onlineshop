const { QueueServiceClient } = require('@azure/storage-queue');
const axios = require('axios');

module.exports = async function (context, req) {
    context.log("🚀 Checkout-Funktion gestartet.");

    // CORS Handling
    if (req.method === "OPTIONS") {
        context.res = {
            status: 200,
            headers: {
                "Access-Control-Allow-Origin": process.env.CORS_ALLOWED_ORIGIN,
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, x-functions-key",
                "Access-Control-Max-Age": "86400"
            },
            body: ""
        };
        return;
    }

    try {
        const { productId, quantity } = req.body;

        if (!productId || !quantity) {
            context.log.error("❌ Fehler: productId oder quantity fehlen im Request.");
            context.res = {
                status: 400,
                body: "productId und quantity müssen angegeben werden."
            };
            return;
        }

        context.log(`📦 API-Call zu AWS /inventory für Produkt ${productId}`);

        const inventoryResponse = await axios.get("http://internal-loadbalancer-main-cluster-1966805206.eu-central-1.elb.amazonaws.com:8000/inventory", {
            params: { productId }
        });

        const availableQuantity = inventoryResponse.data.available;
        context.log(`✅ Verfügbarer Lagerstand für Produkt ${productId}: ${availableQuantity}`);

        if (availableQuantity < quantity) {
            context.log.error(`❌ Lagerbestand zu niedrig für Produkt ${productId}.`);
            context.res = {
                status: 400,
                body: `Lagerbestand zu niedrig für Produkt ${productId}.`
            };
            return;
        }

        context.log(`🛒 API-Call zu AWS /checkout für Produkt ${productId} mit Menge ${quantity}`);

        const checkoutResponse = await axios.post("http://internal-loadbalancer-main-cluster-1966805206.eu-central-1.elb.amazonaws.com:8000/checkout", {
            productId,
            quantity
        });

        context.log(`✅ Bestellung erfolgreich. Verbleibender Lagerstand: ${checkoutResponse.data.remaining_stock}`);

        const queueServiceClient = QueueServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
        const queueClient = queueServiceClient.getQueueClient(process.env.AZURE_QUEUE_NAME);

        await queueClient.sendMessage(
            Buffer.from(JSON.stringify({ productId, quantity })).toString('base64')
        );

        context.res = {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": process.env.CORS_ALLOWED_ORIGIN
            },
            body: JSON.stringify({
                message: "Bestellung erfolgreich und Nachricht zur Queue hinzugefügt!"
            })
        };

    } catch (error) {
        context.log.error("❌ Fehler beim Verarbeiten der Bestellung:", error.message);
        context.log.error("📄 Stack Trace:", error.stack);
        context.res = {
            status: 500,
            body: `Interner Fehler: ${error.message}`
        };
    }
};