const { QueueClient } = require("@azure/storage-queue");
const axios = require("axios");

module.exports = async function (context, req) {
    try {
        const { productId, quantity } = req.body;

        if (!productId || !quantity) {
            context.res = {
                status: 400,
                body: "Fehler: Produkt oder Menge fehlen."
            };
            return;
        }

        // 📞 Fixe Telefonnummer für die SMS
        const customerPhone = "+4369910160940";

        // 1️⃣ Lagerstand von AWS API abfragen
        const stockResponse = await axios.post("https://aws-api-url/inventory", {
            productId: productId
        });

        const availableQuantity = stockResponse.data.available;

        if (availableQuantity < quantity) {
            context.res = {
                status: 400,
                body: `Lagerbestand zu niedrig für Produkt ${productId}.`
            };
            return;
        }

        // 2️⃣ Lagerbestand in AWS reduzieren (Checkout)
        const checkoutResponse = await axios.post("https://aws-api-url/checkout", {
            productId: productId,
            quantity: quantity
        });

        const remainingStock = checkoutResponse.data.remaining_stock;

        if (remainingStock === undefined) {
            context.res = {
                status: 500,
                body: "Fehler beim Aktualisieren des Lagerbestands in AWS."
            };
            return;
        }

        // 3️⃣ Bestellung in die Azure Queue schreiben
        const queueClient = new QueueClient(process.env.AzureWebJobsStorage, "bestellungen");
        await queueClient.createIfNotExists();

        const orderMessage = {
            to: customerPhone,
            message: `Bestellung erfolgreich für ${quantity}x Produkt ${productId}. Verbleibender Lagerstand: ${remainingStock}.`
        };

        await queueClient.sendMessage(Buffer.from(JSON.stringify(orderMessage)).toString('base64'));

        context.res = {
            status: 200,
            body: "Bestellung erfolgreich verarbeitet und Lagerbestand reduziert."
        };

    } catch (error) {
        context.log.error("Fehler beim Verarbeiten der Bestellung:", error);
        context.res = {
            status: 500,
            body: `Interner Fehler: ${error.message}`
        };
    }
};
