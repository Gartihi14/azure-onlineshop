const { QueueServiceClient } = require('@azure/storage-queue');
const axios = require('axios');
const twilio = require('twilio');

module.exports = async function (context, req) {
    context.log("🚀 Checkout-Funktion gestartet.");

    try {
        const { productId, quantity } = req.body;

        if (!productId || !quantity) {
            context.log.error("❌ Fehler: productId oder quantity fehlen im Request.");
            context.res = {
                status: 400,
                body: { message: "productId und quantity müssen angegeben werden." }
            };
            return;
        }

        context.log(`📦 API-Call zu AWS /inventory für Produkt ${productId}`);

        // Inventory API Call (GET)
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

        context.log(`🛒 API-Call zu AWS /checkout für Produkt ${productId} mit Menge ${quantity}`);

        // Checkout API Call (POST)
        const checkoutResponse = await axios.post("http://internal-loadbalancer-main-cluster-1966805206.eu-central-1.elb.amazonaws.com:8000/checkout", {
            productId: productId,
            quantity: quantity
        });

        const remainingStock = checkoutResponse.data.remaining_stock;
        context.log(`✅ Bestellung erfolgreich. Verbleibender Lagerstand: ${remainingStock}`);

        // Nachricht zur Azure Storage Queue hinzufügen
        context.log(`📩 Nachricht zur Queue hinzufügen: Produkt ${productId}, Menge ${quantity}`);
        const queueServiceClient = QueueServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
        const queueClient = queueServiceClient.getQueueClient(process.env.AZURE_QUEUE_NAME);

        await queueClient.sendMessage(
            Buffer.from(JSON.stringify({ productId, quantity })).toString('base64')
        );

        // SMS-Versand mit Twilio
        context.log("📲 Sende Bestellbestätigungs-SMS...");
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        
        await client.messages.create({
            body: `Ihre Bestellung für Produkt ${productId} (Menge: ${quantity}) war erfolgreich.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: "+4369910160940" // Zielnummer anpassen
        });

        context.log("✅ SMS erfolgreich gesendet!");

        // Erfolgreiche API-Antwort
        context.res = {
            status: 200,
            body: { message: "Bestellung erfolgreich, Nachricht zur Queue hinzugefügt und SMS versendet!" }
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
