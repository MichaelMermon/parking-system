const API_URL = 'https://parkingsystem-kohl.vercel.app';  // API endpoint for interacting with the backend

// Utility function to get the class for slot status (reserved, occupied, available)
const getStatusClass = (status) => {
    if (status.includes('Reserved')) return 'reserved';  // Reserved status
    if (status.includes('Occupied')) return 'occupied';  // Occupied status
    if (status.includes('Available')) return 'available';  // Available status
    return '';  // Default case
};

// Fetch and display slot statuses from the server
async function fetchSlots() {
    try {
        const response = await fetch(`${API_URL}/api/slots`);  // Fetch slot data from the backend
        if (!response.ok) throw new Error(`Error: ${response.status}`);  // Handle errors
        const slots = await response.json();  // Parse the response as JSON
        updateSlotStatuses(slots);  // Update the UI with slot data
    } catch (error) {
        console.error('Error fetching slots:', error);  // Log the error
        alert('Failed to load parking slots. Please try again later.');  // Show error alert
    }
}

// Update the parking status display based on fetched data
function updateSlotStatuses(slots) {
    const parkingStatus = document.getElementById('parking-status');
    parkingStatus.innerHTML = '';  // Clear existing content

    // Loop through each slot and create the slot elements dynamically
    slots.forEach(slot => {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'slot';  // Assign class for styling
        slotDiv.id = `slot-${slot.id}`;  // Set a unique ID for each slot
        const statusClass = getStatusClass(slot.status);  // Get the class based on the status

        // Set inner HTML content for each slot
        slotDiv.innerHTML = `
            <h3>Slot ${slot.id}</h3>
            <p>Status: <span class="${statusClass}">${slot.status}</span></p>
        `;
        parkingStatus.appendChild(slotDiv);  // Add the slot div to the container
    });
}

// Handle reservation form submission
async function handleReservation(event) {
    event.preventDefault();  // Prevent the default form submission behavior

    const reservationData = getReservationData();  // Get data from the form
    if (!isValidReservation(reservationData)) {  // Validate the reservation data
        alert('Please fill in all the fields.');  // Show validation alert
        return;
    }

    try {
        const response = await makeReservation(reservationData);  // Make the reservation request
        const result = await response.json();  // Parse the response as JSON
        alert(result.message);  // Show the result message

        if (response.ok) {
            fetchSlots();  // Fetch updated slot statuses
            generateReceipt(reservationData);  // Generate the receipt for the reservation
            clearReservationForm();  // Clear the form after successful submission
        }
    } catch (error) {
        console.error('Error making reservation:', error);  // Log the error
        alert('An error occurred while making the reservation. Please try again.');  // Show error alert
    }
}

// Get the reservation data from the form
function getReservationData() {
    return {
        slotId: parseInt(document.getElementById('slot').value, 10),  // Get the selected slot ID
        startTime: document.getElementById('start').value,  // Get the start time
        endTime: document.getElementById('end').value,  // Get the end time
        name: document.getElementById('name').value,  // Get the user name
        contact: document.getElementById('contact').value  // Get the user contact
    };
}

// Validate if all reservation fields are filled
function isValidReservation(data) {
    return data.slotId && data.startTime && data.endTime && data.name && data.contact;  // Check that all fields are filled
}

// Make the reservation request to the backend
async function makeReservation(data) {
    return fetch(`${API_URL}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)  // Send reservation data as JSON
    });
}

// Generate a PDF receipt for the reservation
function generateReceipt({ slotId, startTime, endTime, name, contact }) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Parking Reservation Receipt', 20, 20);

    doc.setFontSize(12);
    doc.text(`Name: ${name}`, 20, 40);
    doc.text(`Contact: ${contact}`, 20, 50);
    doc.text(`Slot ID: ${slotId}`, 20, 60);
    doc.text(`Start Time: ${formatDateTime(startTime)}`, 20, 70);
    doc.text(`End Time: ${formatDateTime(endTime)}`, 20, 80);

    doc.setFontSize(14);
    doc.text('Thank you for using our Car Parking Service!', 20, 100);
    doc.text('Please follow the instructions at the entrance of the parking lot:', 20, 110);

    doc.setFontSize(12);
    doc.text('1. Park your vehicle in the assigned slot.', 20, 120);
    doc.text('2. Keep your reservation receipt handy.', 20, 130);
    doc.text('3. Show this receipt to the parking attendant at the entrance.', 20, 140);
    doc.text('4. The parking gate will open for your reserved slot.', 20, 150);

    doc.save(`Reservation_Receipt_Slot_${slotId}.pdf`);  // Save the receipt as a PDF
}

// Format date and time to a readable format
function formatDateTime(dateTimeString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateTimeString).toLocaleString(undefined, options);  // Format using the default locale
}

// Clear the reservation form after submission
function clearReservationForm() {
    document.getElementById('reservation-form').reset();  // Reset the form
}

// Handle cancellation form submission
async function handleCancellation(event) {
    event.preventDefault();  // Prevent the default form submission behavior

    const contact = document.getElementById('cancel-contact').value;  // Get the contact number for cancellation
    const slotId = document.getElementById('cancel-slot').value;  // Get the slot ID for cancellation (optional)

    if (!contact) {  // Validate that the contact is provided
        alert('Please provide your contact number.');  // Show validation alert
        return;
    }

    const cancellationData = { contact };
    if (slotId) cancellationData.slotId = parseInt(slotId, 10);  // Add slot ID if provided

    try {
        const response = await fetch(`${API_URL}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cancellationData)  // Send cancellation data to the backend
        });

        const result = await response.json();  // Parse the response as JSON
        alert(result.message);  // Show the result message

        if (response.ok) {
            fetchSlots();  // Fetch updated slot statuses
            displayCancellationConfirmation(result);  // Display cancellation confirmation
        }
    } catch (error) {
        console.error('Error canceling reservation:', error);  // Log the error
        alert('An error occurred while canceling the reservation. Please try again.');  // Show error alert
    }
}

// Display cancellation confirmation after successful cancellation
function displayCancellationConfirmation({ contact, slotId }) {
    const confirmationDetails = document.getElementById('confirmation-details');
    confirmationDetails.innerHTML = `
        <p>Reservation for Contact: <strong>${contact}</strong> ${slotId ? `and Slot ID: <strong>${slotId}</strong>` : ''} has been canceled successfully.</p>
    `;
    document.getElementById('cancel-confirmation').style.display = 'block';  // Show the cancellation confirmation section
}

// Add event listener to the reservation form
document.getElementById('reservation-form').addEventListener('submit', handleReservation);

// Add event listener to the cancellation form
document.getElementById('cancel-form').addEventListener('submit', handleCancellation);

// Load slots on page load
document.addEventListener('DOMContentLoaded', fetchSlots);
