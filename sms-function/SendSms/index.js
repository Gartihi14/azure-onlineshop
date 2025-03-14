const twilio = require('twilio');

module.exports = async function (context, req) {
    context.log('SMS-Versand wird gestartet...');

    try {
        const toPhone = req.body.to;
        const messageBody = req.body.message;

        // Eingaben prüfen
        if (!toPhone || !messageBody) {
            context.log.error("Fehler: Telefonnummer oder Nachricht fehlen!");
            context.res = {
                status: 400,
                body: "Fehler: Telefonnummer oder Nachricht fehlen!"
            };
            return;
        }

        // Twilio-Umgebungsvariablen laden
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromPhone = process.env.TWILIO_PHONE_NUMBER;

        // Prüfen, ob die Variablen vorhanden sind
        if (!accountSid || !authToken || !fromPhone) {
            context.log.error("Fehler: Twilio-Konfiguration fehlt. Prüfe die Umgebungsvariablen!");
            context.res = {
                status: 500,
                body: "Fehler: Twilio-Konfiguration fehlt oder ist ungültig."
            };
            return;
        }

        const client = twilio(accountSid, authToken);

        // SMS senden
        const message = await client.messages.create({
            body: messageBody,
            from: fromPhone,
            to: toPhone
        });

        context.log(`SMS erfolgreich gesendet: ${message.sid}`);
        context.res = {
            status: 200,
            body: `SMS erfolgreich gesendet an ${toPhone}`
        };

    } catch (error) {
        // Detailliertes Error-Logging
        context.log.error('Fehler beim Senden der SMS:', error);
        context.res = {
            status: 500,
            body: `Fehler beim Senden der SMS: ${error.message}`
        };
    }
};
