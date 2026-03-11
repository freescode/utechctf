const bcrypt = require('bcryptjs');
const db = require('./db');

const challenges = [
    {
        title: "Base64 Decoder",
        category: "Cryptography",
        difficulty: "Beginner",
        points: 100,
        description: "We intercepted this encoded message: `Q1RGe2Jhc2U2NF9pbl9kaXNndWlzZX0=` Can you decode it to find the flag?",
        flag: "CTF{base64_in_disguise}",
        hint: "Try using CyberChef or atob() in browser console"
    },
    {
        title: "ROT13 Mystery",
        category: "Cryptography",
        difficulty: "Beginner",
        points: 100,
        description: "This message was scrambled using ROT13: `PGS{ebg13_vf_sha}` Decode it to find the flag!",
        flag: "CTF{rot13_is_fun}",
        hint: "ROT13 shifts each letter by 13 places"
    },
    {
        title: "What Port Is That?",
        category: "Network Security",
        difficulty: "Beginner",
        points: 100,
        description: "A service is running and accepting emails for delivery between mail servers. What is the default port number for SMTP? Flag format: CTF{portnumber}",
        flag: "CTF{25}",
        hint: "Think about common email protocols"
    },
    {
        title: "Weak Password Storage",
        category: "Data Security",
        difficulty: "Beginner",
        points: 100,
        description: "A developer stored passwords like this in their database: `password=hello123`. What is the correct way? The flag is the name of the process used to secure passwords: CTF{answer}",
        flag: "CTF{hashing}",
        hint: "Passwords should never be stored in plain text"
    },
    {
        title: "Phishing Spotter",
        category: "Social Engineering",
        difficulty: "Beginner",
        points: 100,
        description: "You receive an email from `support@paypa1.com` claiming your account is locked. The link says `www.paypal.com` but hovering shows `www.steal-data.com`. What attack is this? CTF{answer}",
        flag: "CTF{phishing}",
        hint: "Look carefully at the sender email address"
    },
    {
        title: "SQL Login Bypass",
        category: "Web Hacking",
        difficulty: "Beginner",
        points: 150,
        description: "A login form is vulnerable to SQL injection. Try entering this as the username: `admin'--` and anything as the password. The flag will appear if you bypass the login. Flag: CTF{sqli_bypass_success}",
        flag: "CTF{sqli_bypass_success}",
        hint: "The -- comment operator in SQL comments out the rest of the query"
    },
    {
        title: "XSS Playground",
        category: "Web Hacking",
        difficulty: "Intermediate",
        points: 200,
        description: "A search box reflects user input without sanitization. Enter this payload: <script>alert('XSS')</script>. If an alert pops up the site is vulnerable. What type of XSS is this? CTF{answer_xss}",
        flag: "CTF{reflected_xss}",
        hint: "There are 3 types of XSS - stored, reflected, and DOM-based"
    },
    {
        title: "Vigenere Cipher",
        category: "Cryptography",
        difficulty: "Intermediate",
        points: 200,
        description: "Decrypt this Vigenere cipher text using the key 'CYBER': `GMTBH{mpxvi_gmtliv}`. The flag format is CTF{...}",
        flag: "CTF{vigen_cipher}",
        hint: "Use an online Vigenere decoder and try the key CYBER"
    },
    {
        title: "HTTP Object in PCAP",
        category: "Network Security",
        difficulty: "Intermediate",
        points: 200,
        description: "A PCAP file was analyzed and this HTTP GET request was found: `GET /secret?flag=CTF{pcap_master} HTTP/1.1`. What is the flag hidden in the URL parameter?",
        flag: "CTF{pcap_master}",
        hint: "Look at the GET request parameters carefully"
    },
    {
        title: "IDOR Logic Flaw",
        category: "Data Security",
        difficulty: "Intermediate",
        points: 200,
        description: "A web app shows your profile at /profile?id=5. By changing the id to 1 you can see the admin profile which shows: Flag: CTF{idor_found}. What vulnerability is this?",
        flag: "CTF{idor_found}",
        hint: "IDOR stands for Insecure Direct Object Reference"
    },
    {
        title: "String Extraction",
        category: "Reverse Engineering",
        difficulty: "Intermediate",
        points: 200,
        description: "Running the `strings` command on a binary reveals: `DEBUG: flag=CTF{strings_reveal_secrets}`. What is the flag hidden in the binary?",
        flag: "CTF{strings_reveal_secrets}",
        hint: "The strings command extracts readable text from binary files"
    },
    {
        title: "Hash Cracking",
        category: "Data Security",
        difficulty: "Intermediate",
        points: 250,
        description: "You found this MD5 hash in a database: `5f4dcc3b5aa765d61d8327deb882cf99`. Crack it to find the password used as the flag: CTF{crackedpassword}",
        flag: "CTF{password}",
        hint: "Try using an online MD5 lookup tool or hashcat"
    },
    {
        title: "Blind SQL Injection",
        category: "Web Hacking",
        difficulty: "Advanced",
        points: 300,
        description: "A vulnerable URL: `/item?id=1` returns 'exists' or 'not found'. Using boolean-based blind SQLi: `/item?id=1 AND 1=1` returns exists. `/item?id=1 AND 1=2` returns not found. What payload extracts the database version? CTF{answer}",
        flag: "CTF{blind_sqli_boolean}",
        hint: "Boolean-based blind SQLi uses true/false responses to extract data"
    },
    {
        title: "RSA Concept Puzzle",
        category: "Cryptography",
        difficulty: "Advanced",
        points: 300,
        description: "In RSA encryption: p=61, q=53, e=17. Calculate n=p*q. Then find the flag: CTF{value_of_n}",
        flag: "CTF{3233}",
        hint: "n is simply p multiplied by q"
    },
    {
        title: "Network Map Analysis",
        category: "Network Security",
        difficulty: "Advanced",
        points: 300,
        description: "An nmap scan shows: Port 22 (SSH) OPEN, Port 80 (HTTP) OPEN, Port 443 (HTTPS) OPEN, Port 3306 (MySQL) OPEN to 0.0.0.0. Which open port is the most critical security risk? CTF{portnumber}",
        flag: "CTF{3306}",
        hint: "Which service should never be exposed to the public internet?"
    },
    {
        title: "Backup File Exposure",
        category: "Data Security",
        difficulty: "Advanced",
        points: 300,
        description: "A web server has a misconfigured backup file accessible at: `/backup/db_backup.sql`. The file contains: `INSERT INTO users VALUES (1, 'admin', 'CTF{backup_exposed}')`. What is the flag?",
        flag: "CTF{backup_exposed}",
        hint: "Always check for exposed backup files in web directories"
    },
    {
        title: "Pretexting Scenario",
        category: "Social Engineering",
        difficulty: "Advanced",
        points: 300,
        description: "An attacker calls IT support pretending to be a new employee needing urgent password reset. They provide name and department from LinkedIn. What is the best response from IT? CTF{answer}",
        flag: "CTF{verify_identity}",
        hint: "IT should always verify identity through official channels before resetting passwords"
    },
    {
        title: "Advanced Crackme",
        category: "Reverse Engineering",
        difficulty: "Advanced",
        points: 350,
        description: "A program checks your input with this logic: input XOR 0x41 must equal 0x12. What ASCII character is the first character of the flag? CTF{answer}",
        flag: "CTF{S}",
        hint: "XOR is reversible - if A XOR B = C then C XOR B = A"
    }
];

console.log('Seeding challenges...');

challenges.forEach(c => {
    const flag_hash = bcrypt.hashSync(c.flag, 10);
    db.run(
        `INSERT OR IGNORE INTO challenges (title, category, difficulty, points, description, flag_hash, hint) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [c.title, c.category, c.difficulty, c.points, c.description, flag_hash, c.hint],
        function(err) {
            if (err) console.error('Error inserting:', c.title, err);
            else console.log('Added:', c.title);
        }
    );
});