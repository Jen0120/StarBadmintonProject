const db = require('./database.js');
const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const dotenv = require("dotenv");
dotenv.config();


const sendSMS = async (string,number) => {
    const client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    try {
      const message = await client.messages.create({
        body: string,
        from: '+18885306449',
        to: `+1${number}`,
      });
      console.log(message);
    } catch (error) {
      console.log(error);
    }
  }; 
  
  // Check appointment schedule function
  function checkAppointmentSchedule() {
    const sql = `SELECT * FROM appointment JOIN student ON student.student_id = appointment.student_id 
    WHERE startTime > NOW() AND startTime < DATE_ADD(NOW(), INTERVAL 48 HOUR) AND sentMessage = 0`;
  
    db.query(sql, (err, results) => {
      if (err) throw err;
  
      results.forEach((appointment) => {
        const startDateTime = new Date(appointment.startTime);
        const confirmationDateTime = new Date(startDateTime.getTime() - 48 * 60 * 60 * 1000);
        const currentDateTime = new Date();
  
        // Check if the current time is after the confirmation datetime
        if (currentDateTime >= confirmationDateTime && appointment.phoneNumber) {
          const message = 
          `Hi ${appointment.first_name}, this is a message from Star Badminton to confirm your appointment on ${startDateTime.toLocaleString()}. To request any changes, we kindly ask for a 30-hour advance notice. Thank you! `;
          sendSMS(message,appointment.phoneNumber);
  
          // Set appointment to confirmed in the database
          const updateSql = `UPDATE appointment SET sentMessage = 1 WHERE appointment_id = ${appointment.appointment_id}`;
          db.query(updateSql, (updateErr, updateResults) => {
            if (updateErr) throw updateErr;
          });
        }
      });
    });
  }

// Call checkAppointmentSchedule() every hour
setInterval(checkAppointmentSchedule, 60 * 60 * 1000); 

module.exports = router;