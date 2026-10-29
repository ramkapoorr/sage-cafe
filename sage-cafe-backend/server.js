const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// In-memory storage for bookings and orders (resets if server restarts)
let bookingsList = [];
let ordersList = [];

// Configure Gmail Sender
// NOTE: Replace 'YOUR_16_CHAR_GOOGLE_APP_PASSWORD' with your Gmail App Password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ramarorausa@gmail.com',
        pass: 'nkfvolgyuqsdjedf' 
    }
});

// 1. Handle Table Bookings
app.post('/api/book-table', (req, res) => {
    const { name, phone, email, date, time, guests } = req.body;
    
    const newBooking = { id: Date.now(), name, phone, email, date, time, guests, timestamp: new Date() };
    bookingsList.push(newBooking);

    // Email to Cafe Owner (You)
    const mailToOwner = {
        from: 'ramarorausa@gmail.com',
        to: 'ramarorausa@gmail.com',
        subject: `🔔 New Table Booking: ${name} (${guests} Guests)`,
        text: `You have a new table booking!\n\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\nDate: ${date}\nTime: ${time}\nGuests: ${guests}`
    };

    // Email to Customer
    const mailToCustomer = {
        from: 'ramarorausa@gmail.com',
        to: email,
        subject: 'Table Reservation Confirmed - SaGe Cafe',
        text: `Hi ${name},\n\nYour table at SaGe Cafe is successfully reserved!\n\nDate: ${date}\nTime: ${time}\nGuests: ${guests}\n\nWe look forward to welcoming you!\n\nBest regards,\nSaGe Cafe`
    };

    transporter.sendMail(mailToOwner, (error) => {
        if (error) console.log('Owner email error:', error);
    });

    if (email) {
        transporter.sendMail(mailToCustomer, (error) => {
            if (error) console.log('Customer email error:', error);
        });
    }

    res.json({ success: true, message: 'Booking saved and emails dispatched!' });
});

// 2. Handle Online Orders & Payments
app.post('/api/place-order', (req, res) => {
    const { customerName, customerPhone, customerEmail, orderType, items, total, paymentMethod } = req.body;

    const newOrder = { 
        id: 'ORD-' + Math.floor(100000 + Math.random() * 900000), 
        customerName, customerPhone, customerEmail, orderType, items, total, paymentMethod, 
        timestamp: new Date() 
    };
    ordersList.push(newOrder);

    let itemsString = items.map(i => `- ${i.name} x ${i.quantity} (₹${i.price * i.quantity})`).join('\n');

    // Email to Cafe Owner (You)
    const mailToOwner = {
        from: 'ramarorausa@gmail.com',
        to: 'ramarorausa@gmail.com',
        subject: `💰 New Order [${newOrder.id}] - ₹${total} (${paymentMethod})`,
        text: `New Online Order Received!\n\nOrder ID: ${newOrder.id}\nCustomer: ${customerName}\nPhone: ${customerPhone}\nEmail: ${customerEmail}\nType: ${orderType}\nPayment: ${paymentMethod}\n\nItems:\n${itemsString}\n\nTotal: ₹${total}`
    };

    // Email to Customer
    const mailToCustomer = {
        from: 'ramarorausa@gmail.com',
        to: customerEmail,
        subject: `Order Receipt & Confirmation [${newOrder.id}] - SaGe Cafe`,
        text: `Hi ${customerName},\n\nThank you for ordering with SaGe Cafe!\n\nOrder ID: ${newOrder.id}\nOrder Type: ${orderType}\nPayment Method: ${paymentMethod}\n\nOrdered Items:\n${itemsString}\n\nTotal Paid: ₹${total}\n\nYour order is being prepared and will be ready in 15-20 minutes.\n\nBest regards,\nSaGe Cafe`
    };

    transporter.sendMail(mailToOwner, (error) => {
        if (error) console.log('Owner order email error:', error);
    });

    if (customerEmail) {
        transporter.sendMail(mailToCustomer, (error) => {
            if (error) console.log('Customer order email error:', error);
        });
    }

    res.json({ success: true, orderId: newOrder.id, message: 'Order placed successfully!' });
});

// 3. API Endpoints for Dashboard to fetch data
api_bookings = app.get('/api/admin/bookings', (req, res) => {
    res.json(bookingsList);
});

app.get('/api/admin/orders', (req, res) => {
    res.json(ordersList);
});

// Start Server
app.listen(5000, () => {
    console.log('🚀 SaGe Cafe Backend Server running on http://localhost:5000');
});