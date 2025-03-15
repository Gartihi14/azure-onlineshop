const { QueueServiceClient } = require('@azure/storage-queue');
const axios = require('axios');

module.exports = async function (context, req) {
    context.log("🚀 Checkout-Funktion gestartet.");

    try {
        const { productId, quantity, phoneNumber } = req.body;

        if (!productId || !quantity || !phoneNumber) {
            context.log.error("❌ Fehler: productId, quantity oder phoneNumber fehlen im Request.");
            context.res = {
                status: 400,
                body: { message: "productId, quantity und phoneNumber müssen angegeben werden." }
            };
            return;
        }

        // Prüfen, ob Lagerbestand verfügbar ist
        context.log(`📦 API-Call zu AWS /inventory für Produkt ${productId}`);
        const inventoryResponse = await axios.get("http://internal-loadbalancer-main-cluster-1966805206.eu-central-1.elb.amazonaws.com:8000/inventory", {
            params: { productId: productId }
        });

        const availableQuantity = inventoryResponse.data.available;
        context.log(`✅ Verfügbarer Lagerstand für Produkt ${productId}: ${availableQuantity}`);

        if (availableQuantity < quantity) {
            context.log.error(`❌ Lagerbestand zu niedrig für Produkt ${productId}.`);
            context.res = {
                status: 400,
                body: { message: `Lagerbestand zu niedrig für Produkt ${productId}.` }
            };
            return;
        }

        // Bestellung ausführen
        context.log(`🛒 API-Call zu AWS /checkout für Produkt ${productId} mit Menge ${quantity}`);
        const checkoutResponse = await axios.post("http://internal-loadbalancer-main-cluster-1966805206.eu-central-1.elb.amazonaws.com:8000/checkout", {
            productId: productId,
            quantity: quantity
        });

        const remainingStock = checkoutResponse.data.remaining_stock;
        context.log(`✅ Bestellung erfolgreich. Verbleibender Lagerstand: ${remainingStock}`);

        // Nachricht an die Queue senden
        context.log(`📩 Nachricht zur Queue hinzufügen: Produkt ${productId}, Menge ${quantity}`);
        const queueServiceClient = QueueServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
        const queueClient = queueServiceClient.getQueueClient(process.env.AZURE_QUEUE_NAME);

        await queueClient.sendMessage(
            Buffer.from(JSON.stringify({ productId, quantity, phoneNumber })).toString('base64')
        );

        context.res = {
            status: 200,
            body: { message: "Bestellung erfolgreich und Nachricht zur Queue hinzugefügt!" }
        };

    } catch (error) {
        context.log.error("❌ Fehler beim Verarbeiten der Bestellung:", error.message);
        context.log.error("📄 Stack Trace:", error.stack);
        context.res = {
            status: 500,
            body: { message: `Interner Fehler: ${error.message}` }
        };
    }
};
