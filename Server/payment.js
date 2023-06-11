const db = require('./database.js');
const express = require('express');
const router = express.Router();

// Submit Payment
router.post("/api/SubmitPayment", async (req, res) => {
    try {
      const payment = req.body.Payment;
      const paidDate = new Date(payment.paidDate.year, payment.paidDate.month - 1, payment.paidDate.day); // month is 0-indexed in Date constructor
  
      const post = {
        studentName: payment.StudentName,
        coachName: payment.Coach,
        classType: payment.classType,
        paidDate: paidDate,
        timesOfClass: payment.TimesOfClass,
        paymentAmount: payment.paymentAmount
      };
  
      const query = `
        INSERT INTO payment (payment_amount, paid_date, class_type, times_hours, coach_id, student_id) 
        SELECT ?, ?, ?, ?, coach.coach_id, student.student_id 
        FROM coach 
        JOIN student ON student.first_name = ? AND student.last_name = ?
        WHERE coach.coach_name = ?
      `;
  
      // Wrap db.query() in a Promise
      const results = await new Promise((resolve, reject) => {
        db.query(query, [
          post.paymentAmount,
          post.paidDate,
          post.classType,
          post.timesOfClass,
          post.studentName.split(" ")[0],
          post.studentName.split(" ")[1],
          post.coachName,
        ], (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
  
      console.log('Row added successfully');
      res.json("Payment added successfully");
  
    } catch (error) {
      console.error('Error adding row:', error);
      if(error.code == 'ER_DUP_ENTRY'){
        res.json("Duplicate payment");
      }else{
        res.json("Error adding payment");
      }
  
    }
  });

module.exports = router;