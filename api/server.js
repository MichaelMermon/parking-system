// /api/index.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Your existing routes and server logic
const formatDateTime = (dateTime) => {
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    };
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', options);
};

let slots = [
    { id: 1, status: 'Available' },
    { id: 2, status: 'Available' },
    { id: 3, status: 'Occupied' },
    { id: 4, status: 'Available' },
    { id: 5, status: 'Available' },
    { id: 6, status: 'Occupied' },
];

let reservations = [
    { slotId: 1, contact: '1234567890', startTime: '2024-12-28T21:33:00', endTime: '2024-12-28T21:35:00' },
    { slotId: 4, contact: '9876543210', startTime: '2024-12-28T12:00:00', endTime: '2024-12-28T14:00:00' },
];

function checkReservations() {
    const currentTime = new Date();
    reservations.forEach((reservation, index) => {
        const endTime = new Date(reservation.endTime);
        if (currentTime > endTime) {
            const slot = slots.find((s) => s.id === reservation.slotId);
            if (slot) {
                slot.status = 'Available';
            }
            reservations.splice(index, 1);
        }
    });
}

app.get('/api/slots', (req, res) => {
    checkReservations();
    res.json(slots);
});

app.post('api/cancel', (req, res) => {
    const { contact, slotId } = req.body;
    if (!contact) {
        return res.status(400).json({ message: 'Contact number is required.' });
    }
    const trimmedContact = contact.trim();
    const reservationIndex = reservations.findIndex(
        (r) => r.contact === trimmedContact && (!slotId || r.slotId === parseInt(slotId))
    );
    if (reservationIndex === -1) {
        return res.status(404).json({ message: 'No matching reservation found for cancellation.' });
    }
    const canceledReservation = reservations.splice(reservationIndex, 1)[0];
    const slot = slots.find((s) => s.id === canceledReservation.slotId);
    if (slot) {
        slot.status = 'Available';
    }
    res.json({ success: true, message: `Reservation for Slot ${canceledReservation.slotId} canceled successfully.` });
});

app.post('api/reserve', (req, res) => {
    const { slotId, contact, startTime, endTime } = req.body;
    const slot = slots.find((s) => s.id === slotId);
    if (slot) {
        if (slot.status === 'Available') {
            const formattedStartTime = formatDateTime(startTime);
            const formattedEndTime = formatDateTime(endTime);
            slot.status = `Reserved<br>From: ${formattedStartTime}<br>To: ${formattedEndTime}`;
            reservations.push({ slotId, contact, startTime, endTime });
            res.json({ success: true, message: `Slot ${slotId} reserved successfully.` });
        } else {
            res.status(400).json({ success: false, message: `Slot ${slotId} is not available.` });
        }
    } else {
        res.status(404).json({ success: false, message: `Slot ${slotId} not found.` });
    }
});

// Export the app as a Vercel serverless function
module.exports = app;
