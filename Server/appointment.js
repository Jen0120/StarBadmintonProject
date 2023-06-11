const db = require('./database.js');
const express = require('express');
const router = express.Router();

router.post("/api/CreateAppointment", (req, res) => {
    try {
      const apt = req.body.Appointment;
      const aptDate = new Date(apt.Date);
      const aptEndHour = aptDate.getHours() + apt.HourOfClass;
      const aptEndMin = aptDate.getMinutes();
      const time = `${aptEndHour}:${aptEndMin}:00`;
      const date = apt.Date.slice(0, 10);
      const EndTime = `${date}T${time}`;
  
      const post = { 
        studentName: apt.StudentName,
        coachName: apt.Coach,
        class_type: apt.classType, 
        attendance_date: apt.Date,
        class_hour: apt.HourOfClass,
        repeatTimes: apt.repeatTimes,
        repeatWeekly: apt.repeatWeekly,
        startTime: apt.Date,
        EndTime: EndTime
      };
  
      db.getConnection((err, conn) => {
        if (err) {
          console.error('Error getting connection:', err);
          res.json("Error getting connection");
          return;
        }
  
        const query = `INSERT INTO appointment (appointment_date, sentMessage,
          class_type, class_hour, startTime, endTime, coach_id, student_id) 
          SELECT ?, ?, ?, ?, ?, ?, coach.coach_id, student.student_id FROM coach 
          JOIN student ON student.first_name = ? AND student.last_name = ?
          WHERE coach.coach_name = ?
        `;
  
        conn.query(query, [post.attendance_date, false,
          post.class_type, post.class_hour, post.startTime, post.EndTime, post.studentName.split(" ")[0], 
          post.studentName.split(" ")[1], post.coachName], (err, results) => {
            conn.release();
            if (err) {
              console.error('Error adding row:', err);
              res.status(500).send("Error adding appointment");
              return;
            }
            console.log('Row added successfully');
            res.json("appointment added successfully");
        });
      });
  
    } catch (error) {
      console.error('Error adding row:', error);
      res.json("Error adding appointment");
    }
  });

  // Delete Appointment route
router.post("/api/DeleteAppointment", async (req, res) => {
    try {
      const id = Number(req.body.id);
      const query = `DELETE FROM Appointment WHERE appointment_id = ?`;
      // Wrap db.query() in a Promise
      const results = await new Promise((resolve, reject) => {
        db.query(query, [id], (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
      console.log('Row deleted successfully');
      res.json("Appointment deleted successfully");
    } catch (error) {
      console.error('Error deleting row:', error);
      res.json('Error deleting appointment');
    }
});

router.get('/api/loadAppointments', (req, res) => {
    const query = `SELECT * FROM appointment as a 
      JOIN student ON a.student_id = student.student_id
      JOIN coach on a.coach_id = coach.coach_id `;
    db.query(query, (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve events from database' });
        return;
      }
      const events = results.map((row) => ({
        id: row.appointment_id,
        title: `${row.last_name} ${row.first_name}`,
        start: row.startTime,
        end: row.endTime,
        allDay: false,
      }));
      res.json(events);
    });
  });


module.exports = router;