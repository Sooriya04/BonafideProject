// server.js
const express = require('express');
const path = require('path');

const app = express();

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Sample route
app.get('/', (req, res) => {
  const formData = {
    title: 'Mr.',
    name: 'RAHUL R',
    rollno: '660525',
    relation: 'S/o',
    parentName: 'R Rajan',
    year: 'III',
    course: 'B.E',
    branch: 'Electronics and Communication Engineering',
    certificateFor: 'Reliance Foundation Scholarship',
    scholarshipType: '',
    date: new Date().toLocaleDateString('en-GB'), // dd/mm/yyyy format
  };

  res.render('bonafideTemplate', { formData });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
