const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// In-memory storage for bookings and orders
let bookingsList = [];
let ordersList = [];

// Helper function to send email via Resend HTTP API (No npm install required!)
async function sendEmailViaResend({ to, subject, text }) {
    const apiKey = process.env.RESEND_API_KEY || 're_123456789';
    
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                from: 'SaGe Cafe <onboarding@resend.dev>',
                to: [to],
                subject: subject,
                text: text
            })
        });

        const data = await response.json();
        if (!response.ok) {
            console.log('Resend API Error:', data);
        }
        return data;
    } catch (err) {
        console.log('Email fetch network error:', err);
    }
}

// 1. Handle Table Bookings
app.post('/api/book-table', async (req, res) => {
    const { name, phone, email, date, time, guests } = req.body;
    
    const newBooking = { id: Date.now(), name, phone, email, date, time, guests, timestamp: new Date() };
    bookingsList.push(newBooking);

    // Email to Cafe Owner (You)
    await sendEmailViaResend({
        to: 'ramarorausa@gmail.com',
        subject: `🔔 New Table Booking: ${name} (${guests} Guests)`,
        text: `You have a new table booking!\n\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\nDate: ${date}\nTime: ${time}\nGuests: ${guests}`
    });

    // Email to Customer
    if (email) {
        await sendEmailViaResend({
            to: email,
            subject: 'Table Reservation Confirmed - SaGe Cafe',
            text: `Hi ${name},\n\nYour table at SaGe Cafe is successfully reserved!\n\nDate: ${date}\nTime: ${time}\nGuests: ${guests}\n\nWe look forward to welcoming you!\n\nBest regards,\nSaGe Cafe`
        });
    }

    res.json({ success: true, message: 'Booking saved and emails dispatched!' });
});

// 2. Handle Online Orders & Payments
app.post('/api/place-order', async (req, res) => {
    const { customerName, customerPhone, customerEmail, orderType, items, total, paymentMethod } = req.body;

    const newOrder = { 
        id: 'ORD-' + Math.floor(100000 + Math.random() * 900000), 
        customerName, customerPhone, customerEmail, orderType, items, total, paymentMethod, 
        timestamp: new Date() 
    };
    ordersList.push(newOrder);

    let itemsString = items.map(i => `- ${i.name} x ${i.quantity} (₹${i.price * i.quantity})`).join('\n');

    // Email to Cafe Owner
    await sendEmailViaResend({
        to: 'ramarorausa@gmail.com',
        subject: `💰 New Order [${newOrder.id}] - ₹${total} (${paymentMethod})`,
        text: `New Online Order Received!\n\nOrder ID: ${newOrder.id}\nCustomer: ${customerName}\nPhone: ${customerPhone}\nEmail: ${customerEmail}\nType: ${orderType}\nPayment: ${paymentMethod}\n\nItems:\n${itemsString}\n\nTotal: ₹${total}`
    });

    // Email to Customer
    if (customerEmail) {
        await sendEmailViaResend({
            to: customerEmail,
            subject: `Order Receipt & Confirmation [${newOrder.id}] - SaGe Cafe`,
            text: `Hi ${customerName},\n\nThank you for ordering with SaGe Cafe!\n\nOrder ID: ${newOrder.id}\nOrder Type: ${orderType}\nPayment Method: ${paymentMethod}\n\nOrdered Items:\n${itemsString}\n\nTotal Paid: ₹${total}\n\nYour order is being prepared and will be ready in 15-20 minutes.\n\nBest regards,\nSaGe Cafe`
        });
    }

    res.json({ success: true, orderId: newOrder.id, message: 'Order placed successfully!' });
});

// 3. API Endpoints for Dashboard to fetch data
app.get('/api/admin/bookings', (req, res) => {
    res.json(bookingsList);
});

app.get('/api/admin/orders', (req, res) => {
    res.json(ordersList);
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 SaGe Cafe Backend Server running on port ${PORT}`);
});