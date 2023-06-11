const db = require('./database.js');

class Student {

    constructor(id, last_name, first_name, phoneNumber, birthYear, city){
        this.last_name = last_name;
        this.first_name = first_name;
        this.id = id;
        this.phoneNumber = phoneNumber;
        this.birthYear = birthYear;
        this.city = city;
    }

    static createNewStudent(post, callback){
        const sql = "INSERT INTO Student SET ?";
        const checkDuplicateSql = "SELECT COUNT(*) as count FROM student WHERE LOWER(last_name) = ? AND LOWER(first_name) = ?";
      
        db.query(checkDuplicateSql, [post.last_name.toLowerCase(), post.first_name.toLowerCase()], (err, result) => {
            if (err) {
              callback(err);
              return;
            }
            const count = result[0].count;
            if (count > 0) {
              callback('Student already exists');
              return;
            }
            // Insert new student
            db.query(sql, post, (err) => {
              if (err) {
                callback(err);
                return;
              }
              callback(null);
            });
          });
    }

    static deleteStudent(studentId, callback){
    // Delete related payment records
    const deletePaymentsQuery = 'DELETE FROM payment WHERE student_id = ?';
    const deletePaymentsPromise = db.promise().query(deletePaymentsQuery, [studentId]);
    // Delete related appointment records
    const deleteAppointmentsQuery = 'DELETE FROM appointment WHERE student_id = ?';
    const deleteAppointmentsPromise = db.promise().query(deleteAppointmentsQuery, [studentId]);
    // Delete the student record
    const deleteStudentQuery = 'DELETE FROM student WHERE student_id = ?';
    const deleteStudentPromise = db.promise().query(deleteStudentQuery, [studentId]);

    Promise.all([deletePaymentsPromise, deleteAppointmentsPromise, deleteStudentPromise])
    .then(() => {
        callback(null);
    })
    .catch((err) => {
        if (err) {
            callback(err);
            return;
          }
    });
    }

    static editStudent(phoneNumber, birthYear, city, first_name, last_name,callback){
        const updateQuery = 'UPDATE student SET phoneNumber = ?, birthYear = ?, city = ? WHERE first_name = ? AND last_name = ?';
        db.promise()
          .query(updateQuery, [phoneNumber, birthYear, city, first_name, last_name])
          .then(() => {
            callback('Edit successful');
          })
          .catch((err) => {
            callback(err);
            return;
          });
    }

    static getStudentPayments(id, callback) {
        const query = `SELECT * FROM student s
        JOIN payment p ON s.student_id = p.student_id
        JOIN coach c ON p.coach_id = c.coach_id
        WHERE s.student_id = ?`;
        db.promise()
          .query(query, id)
          .then(([results]) => {
                const student = results[0];
                callback(null, student);
          })
          .catch((err) => {
            callback(err);
            return;
        });
    }

    static getStudent(id, callback){
        const query = `select * from student s 
        left join appointment a on s.student_id = a.student_id 
        left join coach c on a.coach_id = c.coach_id
        where s.student_id = ?`;
      
        db.promise().query(query,id)
          .then((results) => {
            console.log('Data received from Db:');
            const student = results[0];
            callback(null, student);
          })
          .catch((err) => {
            callback(err);
            return;
        });
    }

    static LoadStudentLists(callback){
        const query = `
        SELECT s.student_id, s.first_name, s.last_name, COALESCE(SUM(a.class_hour), 0) AS schedule_hours, 
        COALESCE(SUM(p.paid_hours), 0) AS paid_hours,COALESCE(SUM(p.paid_hours), 0) - COALESCE(SUM(a.class_hour), 0) 
        AS remaining_hours, a.class_type FROM student s
        
        LEFT JOIN (SELECT SUM(class_hour) AS class_hour, student_id, class_type FROM appointment 
        GROUP BY student_id, class_type) a ON s.student_id = a.student_id

        LEFT JOIN (SELECT SUM(times_hours) AS paid_hours, student_id, class_type FROM payment 
        GROUP BY student_id, class_type) p ON s.student_id = p.student_id AND a.class_type = p.class_type
        GROUP BY s.student_id, a.class_type;`;
      
        db.promise().query(query) 
        .then(([results]) => {
            console.log('Data received from Db:');
            const students = results;
            console.log(students);
            callback(null, students);
        })
        .catch((err) => {
            console.error(err);
            callback(err);
        });
    }

}

module.exports = Student;