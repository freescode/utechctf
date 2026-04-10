# ⚡ UTech CTF Hub

A reusable Capture The Flag (CTF) learning platform built for the University of Technology, Jamaica Ethical Hacking (CNS3005).

## 🔗 Live Demo
https://utechctf-1.onrender.com/

## Documentation & Presentation 
Link: 

##  About
UTech CTF Hub is a web-based cybersecurity learning platform designed for repeated classroom use. Students can work through hacking challenges, quizzes, and a Jeopardy board while instructors manage everything through an Admin Panel. 

##  Features
- 18 CTF Challenges across Beginner, Intermediate, and Advanced tiers
- 6 Categories: Web Hacking, Cryptography, Network Security, Reverse Engineering, Data Security, Social Engineering
- Learn Section with 8 structured topic cards
- Jeopardy Board: 6 categories, 30 questions
- 3 Multiple-choice Quizzes (10 questions each)
- Live Scoreboard with rankings
- Admin Panel ; add, edit, enable/disable challenges, reset scoreboard
- JWT Authentication with bcrypt password hashing

##  Tech Stack

| Layer      | Technology                  |
|------------|-----------------------------|
| Backend    | Node.js + Express.js        |
| Database   | SQLite3                     |
| Frontend   | HTML / CSS / Vanilla JS     |
| Auth       | JWT + bcryptjs              |
| Hosting    | Render                      |


##  Running Locally on Vs Code 

**Prerequisites:** Node.js installed

```bash
# Clone the repo
git clone https://github.com/freecode/utechctf.git
cd utechctf

# Install dependencies
npm install

# Start the server
node server.js
```

Then open your browser and go to `http://localhost:3000`

##  Admin Access
To access the Admin Panel, log in with the admin account and navigate to `/pages/admin.html`

##  Group Members

| Group Member | ID        | Website Contributions | Report Contributions |
|--------------|-----------|-----------------------|----------------------|
| Merrick Foster | 2306913 | - Backend <br> - Login system <br> - Database <br> - Flag validation <br> - Scoring system <br> - Admin Panel | System Architecture, Platform Features, Technologies Used |
| Xavier Campbell | 2101552 | - Challenge pages <br> - File uploads <br> - Flag submission logic | |
| Miessa Wright | 2300715 | - Admin Panel <br> - Add/edit/delete challenges <br> - Enable/disable <br> - Reset scoreboard | |
| Jasmin Nelson | 2303868 | - Learn Section and Quizzes <br> - Learning notes <br> - Quiz system <br> - Question | |

			
			
			


## 📚 Course
**Module:** Ethical Hacking ( CNS3005 )
**Institution:** University of Technology, Jamaica  
**Date:** April 9, 2026
