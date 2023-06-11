const express = require("express");
const twilio = require('twilio');
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const appointmentRouter = require('./appointment');
const paymentRouter = require('./payment.js');
const textMessageRouter = require('./textMessage.js');
const Student = require('./student');
const app = express();
app.use(bodyParser.json());
const port = process.env.PORT || 8080;
const db = require('./database.js');
app.use(express.static(__dirname + '/dist/sign-in-sheet'));
app.get('/home', (req, res) => {
  res.sendFile(__dirname + '/dist/sign-in-sheet/index.html');
});
app.get('/Students', (req, res) => {
  res.sendFile(__dirname + '/dist/sign-in-sheet/index.html');
});
app.get('/Paymemts', (req, res) => {
  res.sendFile(__dirname + '/dist/sign-in-sheet/index.html');
});

app.use(appointmentRouter);
app.use(paymentRouter);
app.use(textMessageRouter);
dotenv.config();

// Create New Student
app.post("/api/CreateNewStudent", (req, res) => {
  const post = { 
    last_name: req.body.student.last_name, 
    first_name:req.body.student.first_name, 
    phoneNumber: req.body.student.phoneNumber, 
    birthYear: req.body.student.birthYear, 
    city: req.body.student.city 
  };
  Student.createNewStudent(post,(error,result) => {
    if(error){
      console.log(error);
      res.json(false);
      return;
    }else{
      res.json(true);
    }
  })
});

// Delete Student
app.post('/api/DeleteStudent', (req, res) => {
  const studentId = req.body.id;
  Student.deleteStudent(studentId,(error, result) => {
    if(error){
      console.error('Error deleting student:', error);
      res.status(500).json('Error deleting student');
      return;
    }
    res.status(200).json('Student deleted successfully');
  })
});

//Edit student
app.post('/api/EditStudent', (req, res) => {
  const { phoneNumber, birthYear, city, first_name, last_name } = req.body.student;
  Student.editStudent(phoneNumber, birthYear, city, first_name, last_name,(error,result) => {
    if(error){
      res.json(error);
      return;
    }else{
      res.json("edit successfully");
    }
  })
});

//Load student's payment list
app.post('/api/GetStudentPayments', (req, res) => {
  const id = req.body.id;
  Student.getStudentPayments(id, (error, result) => {
    if (error) {
      res.status(500).json({ error: 'Failed to retrieve student payments from database' });
    } else {
        const resultArray = Array.isArray(result) ? result : [result];
        res.send(resultArray);
    }
  });
});

//Get student info
app.post('/api/GetStudent', (req, res) => {
  const id = req.body.id;
  Student.getStudent(id, (error, result) => {
    if (error) {
      res.status(500).json({ error: 'Failed to retrieve students info from database' });
    } else {
        const resultArray = Array.isArray(result) ? result : [result];
        res.send(resultArray);
    }
  })
});

// Load All Students with its remaining class condition
app.get('/api/loadStudents', (req, res) => {
  Student.LoadStudentLists((err, students) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to retrieve students from the database' });
      return;
    }
    res.json(students);
  });
});

// Auto Complete
app.post("/api/autoComplete", (req, res) => {
  console.log(req.body);
  const key = req.body.string;

  const query = 'SELECT * FROM student WHERE last_name LIKE ? OR first_name LIKE ?';
  const params = [`%${key}%`, `%${key}%`];

  db.query(query, params, (error, results, fields) => {
    if (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to retrieve students from database' });
      return;
    }

    console.log('Data received from Db:', results);

    let studentList = results.map(row => `${row.first_name} ${row.last_name}`);
    console.log(studentList);
    res.send(studentList);
  });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });


