import logging

logger = logging.getLogger(__name__)

class EmailService:
    
    @staticmethod
    def send_invoice_email(to_email: str, invoice_number: str, amount_kobo: int):
        """Constructs and sends the invoice email to the client."""
        # Convert Kobo to Naira for display purposes
        amount_naira = amount_kobo / 100.0
        
        # MOCK EMAIL DISPATCH
        logger.info("=========================================")
        logger.info(f"📧 DISPATCHING EMAIL TO: {to_email}")
        logger.info(f"Subject: Your Invoice {invoice_number} is ready for payment")
        logger.info(f"Body: Hello, please find your invoice attached. Total due: NGN {amount_naira:,.2f}")
        logger.info("Status: DELIVERED")
        logger.info("=========================================")
        
        # If an external API call fails here, it will raise an exception,
        # telling our message broker to retry the task later.