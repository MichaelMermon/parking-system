// Import necessary modules
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Initialize the Express app and define the port
const app = express();
const PORT = 3000;

// Middleware for handling CORS and JSON parsing
app.use(cors()); // Allow cross-origin requests
app.use(bodyParser.json()); // Parse incoming JSON requests

// Helper function to format date and time for display
function formatDateTime(dateTime) {
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    };
    const date = new Date(dateTime); // Convert the given datetime string to a Date object
    return date.toLocaleString('en-US', options); // Return the formatted datetime string
}

// Simulated parking slots data
let slots = [
    { id: 1, status: 'Available' },
    { id: 2, status: 'Available' },
    { id: 3, status: 'Occupied' },
    { id: 4, status: 'Available' },
    { id: 5, status: 'Available' },
    { id: 6, status: 'Occupied' },
];

// Simulated reservations data (including start and end times)
let reservations = [
    { slotId: 1, contact: '1234567890', startTime: '2024-12-28T21:33:00', endTime: '2024-12-28T21:35:00' },
    { slotId: 4, contact: '9876543210', startTime: '2024-12-28T12:00:00', endTime: '2024-12-28T14:00:00' },
];

// Function to check for expired reservations and update slot statuses
function checkReservations() {
    const currentTime = new Date(); // Get the current date and time
    reservations.forEach((reservation, index) => {
        const endTime = new Date(reservation.endTime); // Convert reservation end time to Date object
        if (currentTime > endTime) { // Check if the reservation has expired
            // Mark the slot as available if reservation has expired
            const slot = slots.find((s) => s.id === reservation.slotId);
            if (slot) {
                slot.status = 'Available'; // Update slot status to 'Available'
            }
            // Remove the expired reservation from the list
            reservations.splice(index, 1);
        }
    });
}

// API endpoint to get all parking slots
app.get('/api/slots', (req, res) => {
    checkReservations(); // Ensure slots are updated before sending response
    res.json(slots); // Return the current state of parking slots
});

// API endpoint to cancel a reservation
app.post('/cancel', (req, res) => {
    const { contact, slotId } = req.body; // Extract contact and slotId from the request body

    if (!contact) {
        return res.status(400).json({ message: 'Contact number is required.' });
    }

    const trimmedContact = contact.trim(); // Trim whitespace from the contact number
    // Find the reservation that matches the contact and optionally the slotId
    const reservationIndex = reservations.findIndex(
        (r) => r.contact === trimmedContact && (!slotId || r.slotId === parseInt(slotId))
    );

    if (reservationIndex === -1) {
        return res.status(404).json({ message: 'No matching reservation found for cancellation.' });
    }

    // Remove the reservation and update the slot status
    const canceledReservation = reservations.splice(reservationIndex, 1)[0];
    const slot = slots.find((s) => s.id === canceledReservation.slotId);
    if (slot) {
        slot.status = 'Available'; // Update slot status to 'Available'
    }

    res.json({ success: true, message: `Reservation for Slot ${canceledReservation.slotId} canceled successfully.` });
});

// API endpoint to make a reservation
app.post('/reserve', (req, res) => {
    const { slotId, contact, startTime, endTime } = req.body; // Extract reservation details from the request body

    const slot = slots.find((s) => s.id === slotId); // Find the slot by its ID
    if (slot) {
        if (slot.status === 'Available') { // Check if the slot is available
            // Reserve the slot and update its status
            const formattedStartTime = formatDateTime(startTime); // Format start time
            const formattedEndTime = formatDateTime(endTime); // Format end time
            slot.status = `Reserved<br>From: ${formattedStartTime}<br>To: ${formattedEndTime}`; // Update slot status with reservation details
            reservations.push({ slotId, contact, startTime, endTime }); // Add the reservation to the list
            res.json({ success: true, message: `Slot ${slotId} reserved successfully.` });
        } else {
            res.status(400).json({ success: false, message: `Slot ${slotId} is not available.` });
        }
    } else {
        res.status(404).json({ success: false, message: `Slot ${slotId} not found.` });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`); // Log server status on successful start
});
