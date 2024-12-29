// Import necessary modules
const express = require('express');  // Express framework for routing
const cors = require('cors');  // CORS module to allow cross-origin requests
const bodyParser = require('body-parser');  // Body parser to parse JSON requests

// Initialize the Express app and define the port
const app = express();  // Create a new Express application

// Middleware for handling CORS and JSON parsing
app.use(cors());  // Allow cross-origin requests from any domain
app.use(bodyParser.json());  // Parse incoming JSON request bodies

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
    const date = new Date(dateTime);  // Convert the given datetime string to a Date object
    return date.toLocaleString('en-US', options);  // Return the formatted datetime string
}

// Simulated parking slots data
let slots = [
    { id: 1, status: 'Available' },  // Slot 1 is available
    { id: 2, status: 'Available' },  // Slot 2 is available
    { id: 3, status: 'Occupied' },   // Slot 3 is occupied
    { id: 4, status: 'Available' },  // Slot 4 is available
    { id: 5, status: 'Available' },  // Slot 5 is available
    { id: 6, status: 'Occupied' },   // Slot 6 is occupied
];

// Simulated reservations data (including start and end times)
let reservations = [
    { slotId: 1, contact: '1234567890', startTime: '2024-12-28T21:33:00', endTime: '2024-12-28T21:35:00' },
    { slotId: 4, contact: '9876543210', startTime: '2024-12-28T12:00:00', endTime: '2024-12-28T14:00:00' },
];

// Function to check for expired reservations and update slot statuses
function checkReservations() {
    const currentTime = new Date();  // Get the current date and time
    reservations.forEach((reservation, index) => {
        const endTime = new Date(reservation.endTime);  // Convert reservation end time to Date object
        if (currentTime > endTime) {  // Check if the reservation has expired
            // Mark the slot as available if reservation has expired
            const slot = slots.find((s) => s.id === reservation.slotId);
            if (slot) {
                slot.status = 'Available';  // Update slot status to 'Available'
            }
            // Remove the expired reservation from the list
            reservations.splice(index, 1);
        }
    });
}

// API endpoint to get all parking slots
app.get('/api/slots', (req, res) => {
    checkReservations();  // Ensure slots are updated before sending response
    res.json(slots);  // Return the current state of parking slots
});

// API endpoint to cancel a reservation
app.post('/api/cancel', (req, res) => {
    const { contact, slotId } = req.body;  // Extract contact and slotId from the request body

    // If no contact is provided, return an error
    if (!contact) {
        return res.status(400).json({ message: 'Contact number is required.' });
    }

    const trimmedContact = contact.trim();  // Trim whitespace from the contact number
    // Find the reservation that matches the contact and optionally the slotId
    const reservationIndex = reservations.findIndex(
        (r) => r.contact === trimmedContact && (!slotId || r.slotId === parseInt(slotId))
    );

    // If no reservation matches, return a 404 error
    if (reservationIndex === -1) {
        return res.status(404).json({ message: 'No matching reservation found for cancellation.' });
    }

    // Remove the reservation and update the slot status
    const canceledReservation = reservations.splice(reservationIndex, 1)[0];
    const slot = slots.find((s) => s.id === canceledReservation.slotId);
    if (slot) {
        slot.status = 'Available';  // Update slot status to 'Available'
    }

    // Send success response
    res.json({ success: true, message: `Reservation canceled successfully.` });
});

// API endpoint to make a reservation
app.post('/api/reserve', (req, res) => {
    const { slotId, contact, startTime, endTime } = req.body;  // Extract reservation details from the request body

    // Find the slot by its ID
    const slot = slots.find((s) => s.id === slotId);
    if (slot) {
        if (slot.status === 'Available') {  // Check if the slot is available
            // Reserve the slot and update its status
            const formattedStartTime = formatDateTime(startTime);  // Format start time
            const formattedEndTime = formatDateTime(endTime);  // Format end time
            slot.status = `Reserved<br>From: ${formattedStartTime}<br>To: ${formattedEndTime}`;  // Update slot status with reservation details
            reservations.push({ slotId, contact, startTime, endTime });  // Add the reservation to the list
            res.json({ success: true, message: `Slot ${slotId} reserved successfully.` });
        } else {
            res.status(400).json({ success: false, message: `Slot ${slotId} is not available.` });
        }
    } else {
        res.status(404).json({ success: false, message: `Slot ${slotId} not found.` });
    }
});

// Export the app as a Vercel serverless function
module.exports = app;  // Export the app for deployment (e.g., on Vercel or similar platforms)
