require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcrypt');
const multer = require('multer'); 
const path = require('path');
const fs = require('fs'); 
const xlsx = require('xlsx');
const db = require('./db'); 
const generateRandomId = () => Math.floor(100000 + Math.random() * 900000);
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key_change_this_in_production";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// ==========================================
// ไฟล์อัปโหลด
// ==========================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = './uploads/others';
        
        const type = req.body.type; 
        const url = req.originalUrl;

        if (url.includes('teachers')) {
            folder = './uploads/teachers';
        } 
        else if (url.includes('staffs')) {
            folder = './uploads/staffs';
        } 
        else if (type === 'book' || url.includes('/book')) { 
            folder = './uploads/books';
        }
        else if (url.includes('research')) {
            folder = './uploads/researches';
        }
        else if (url.includes('students')) {
            folder = './uploads/students';
        }
        else if (url.includes('internships')) {
            folder = './uploads/internships';
        }
        else if (url.includes('teacher-works')) {
            folder = './uploads/teacher_works';
        }
        else if (url.includes('staff-works')) {
            folder = './uploads/staff_works';
        }
        else if (url.includes('student-works')) {
            folder = './uploads/student_works';
        }
        if (!fs.existsSync(folder)){
            fs.mkdirSync(folder, { recursive: true });
        }
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const cleanName = originalName.replace(/\s+/g, '_');
        cb(null, Date.now() + '_' + cleanName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('รองรับเฉพาะไฟล์รูปภาพ, PDF, Word และ Excel (xlsx, csv) เท่านั้น'), false);
        }
    }
});
// ==========================================
// Form Login (Staff และ Teacher)
// ==========================================
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "กรุณากรอก Username และ Password" });
    }

    try {
        let user = null;
        let userType = '';
        const [staffs] = await db.promise().query(`
            SELECT s.*, r.name as role_name 
            FROM staffs s 
            LEFT JOIN roles r ON s.role_id = r.id 
            WHERE s.staff_code = ? OR s.email = ?
        `, [username, username]);

        if (staffs.length > 0) {
            user = staffs[0];
            userType = 'staff';
        } else {
            const [teachers] = await db.promise().query(`
                SELECT t.*, r.name as role_name 
                FROM teachers t 
                LEFT JOIN roles r ON t.role_id = r.id 
                WHERE t.teacher_code = ? OR t.email = ?
            `, [username, username]);
            
            if (teachers.length > 0) {
                user = teachers[0];
                userType = 'teacher';
            }
        }

        if (!user) {
            return res.status(401).json({ message: "ไม่พบชื่อผู้ใช้งานนี้ในระบบ" });
        }

        if (user.status !== 'active') {
            return res.status(403).json({ message: "บัญชีผู้ใช้นี้ถูกระงับการใช้งาน" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });
        }

        const [permissionsData] = await db.promise().query(`
            SELECT p.name 
            FROM roles r
            JOIN role_permissions rp ON r.id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE r.id = ?
        `, [user.role_id]);

        const permissions = permissionsData.map(p => p.name);
        
        const payload = {
            userId: user.id,
            username: userType === 'staff' ? user.staff_code : user.teacher_code,
            firstName: user.first_name_th,
            lastName: user.last_name_th,
            userType: userType, 
            roleId: user.role_id,
            roleName: user.role_name || (userType === 'staff' ? 'เจ้าหน้าที่' : 'อาจารย์'), 
            permissions: permissions 
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });  
        res.json({
            message: "เข้าสู่ระบบสำเร็จ",
            token: token,
            user: payload
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
    }
});

// ==========================================
// เปลี่ยนรหัสผ่าน
// ==========================================
app.post('/api/auth/direct-reset-password', async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({ message: "กรุณากรอกอีเมลและรหัสผ่านใหม่ให้ครบถ้วน" });
    }

    try {
        let user = null;
        let tableName = '';

        const [staffs] = await db.promise().query('SELECT id FROM staffs WHERE email = ?', [email]);
        if (staffs.length > 0) {
            user = staffs[0];
            tableName = 'staffs';
        } else {
            const [teachers] = await db.promise().query('SELECT id FROM teachers WHERE email = ?', [email]);
            if (teachers.length > 0) {
                user = teachers[0];
                tableName = 'teachers';
            }
        }
        if (!user) {
            return res.status(404).json({ message: "ไม่พบผู้ใช้งานที่ลงทะเบียนด้วยอีเมลนี้" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.promise().query(
            `UPDATE ${tableName} SET password = ? WHERE id = ?`, 
            [hashedPassword, user.id]
        );

        res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที" });

    } catch (error) {
        console.error("Direct Reset Password Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ ไม่สามารถเปลี่ยนรหัสผ่านได้" });
    }
});
// ==========================================
// บุคคลทั่วไป
// ==========================================
app.post('/api/auth/guest', (req, res) => {
    const guestPermissions = ['view_public_content', 'read_announcements']; 

    const payload = {
        userId: generateRandomId(), 
        username: 'Guest',
        firstName: 'บุคคล',
        lastName: 'ทั่วไป',
        userType: 'guest',
        roleId: 4, 
        roleName: 'บุคคลทั่วไป', 
        permissions: guestPermissions
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '4h' });

    res.json({
        message: "เข้าสู่ระบบในฐานะผู้เยี่ยมชม",
        token: token,
        user: payload
    });
});
// ==========================================
// SSO Callback
// ==========================================
app.post('/api/auth/sso/callback', async (req, res) => {
    const { code, redirectUri } = req.body;
    const CLIENT_ID = process.env.SSO_CLIENT_ID;
    const CLIENT_SECRET = process.env.SSO_CLIENT_SECRET;
    
    try {
        const tokenResponse = await axios.post("https://sso.kmutnb.ac.th/auth/token", new URLSearchParams({
            grant_type: 'authorization_code',
            code, redirect_uri: redirectUri, client_id: CLIENT_ID, client_secret: CLIENT_SECRET
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

        const accessToken = tokenResponse.data.access_token;
        const userResponse = await axios.get("https://sso.kmutnb.ac.th/resources/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const userData = userResponse.data;
        
        const username = userData.preferred_username || userData.sub;
        const studentInfo = userData.kmutnb_student_info || {};
        const email = userData.email || `${username}@kmutnb.ac.th`;
        const firstname = studentInfo.stu_first_name_thai || userData.given_name || "Unknown"; 
        const lastname = studentInfo.stu_last_name_thai || userData.family_name || "Unknown";
        const [roleRows] = await db.promise().query('SELECT id FROM roles WHERE name = ? LIMIT 1', ['Student']);
        
        if (roleRows.length === 0) {
            return res.status(500).json({ message: "ไม่พบ Role 'Student' ในระบบ กรุณาสร้างในฐานข้อมูลก่อน" });
        }
        
        const studentRoleId = roleRows[0].id;

        const [permissionsData] = await db.promise().query(`
            SELECT p.name 
            FROM roles r
            JOIN role_permissions rp ON r.id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE r.id = ?
        `, [studentRoleId]);

        const permissions = permissionsData.map(p => p.name);

        const [rows] = await db.promise().query('SELECT * FROM student_users WHERE username = ?', [username]);
        let userId;

        if (rows.length > 0) {
            userId = rows[0].id;
            await db.promise().query(
                'UPDATE student_users SET firstname = ?, lastname = ?, user_type_id = ? WHERE username = ?', 
                [firstname, lastname, studentRoleId, username]
            );
        } else {
            const [result] = await db.promise().query(
                'INSERT INTO student_users (username, firstname, lastname, email, role, user_type_id) VALUES (?, ?, ?, ?, ?, ?)',
                [username, firstname, lastname, email, 'student', studentRoleId]
            );
            userId = result.insertId;
        }

        const payload = {
            userId: userId,
            username: username,
            firstName: firstname,
            lastName: lastname,
            userType: 'student',
            roleId: studentRoleId,
            permissions: permissions 
        };

        const customToken = jwt.sign(payload, process.env.JWT_SECRET || "YOUR_SECRET_KEY", { expiresIn: '8h' });

        res.json({
            token: customToken, 
            ssoToken: accessToken, 
            user: payload
        });

    } catch (error) {
        console.error("SSO Error:", error.message);
        res.status(500).json({ message: "Login failed", error: error.message });
    }
});
// ==========================================
//  Permissions 
// ==========================================
app.get("/api/master-permissions", async (req, res) => {
    try {
        const [results] = await db.promise().query("SELECT name FROM permissions");

        const permissionLabel = {
            view_basic_data: "ดูข้อมูลพื้นฐาน (Dashboard, ข้อมูลส่วนตัว)",
            view_reports: "เข้าถึงและสร้างรายงาน",
            manage_settings: "เข้าถึงเมนูตั้งค่าระบบ",
            manage_research: "จัดการข้อมูลงานวิจัย",
            manage_training: "จัดการข้อมูลการอบรม",
            manage_works: "จัดการข้อมูลผลงาน",
            manage_permissions: "จัดการสิทธิ์การใช้งานระบบ (Roles)",
            manage_surveys: "จัดการแบบประเมิน",
            manage_interns: "จัดการข้อมูลนักศึกษาฝึกงาน (สำหรับ Admin)", 
            view_internship: "ยื่นและดูข้อมูลฝึกงาน (สำหรับนักศึกษา)", 
            manage_users: "จัดการผู้ใช้งาน (อาจารย์, เจ้าหน้าที่, นักศึกษา)",
            manage_insurance_reports: "จัดการรายงานสำหรับส่งประกัน" 
        };

        const formatted = results.map(row => ({
            value: row.name,
            label: permissionLabel[row.name] || row.name
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get("/api/permissions", async (req, res) => {
    try {
        const sql = `SELECT r.id, r.name, GROUP_CONCAT(p.name) as permissions 
                     FROM roles r
                     LEFT JOIN role_permissions rp ON r.id = rp.role_id
                     LEFT JOIN permissions p ON rp.permission_id = p.id
                     GROUP BY r.id`;
        const [results] = await db.promise().query(sql);
        res.json(results.map(row => ({ ...row, permissions: row.permissions ? row.permissions.split(',') : [] })));
    } catch (error) { res.status(500).send(error); }
});

app.post("/api/permissions", async (req, res) => {
    const { name, permissions } = req.body;
    if (!name || !permissions) return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });

    const connection = await db.promise().getConnection();
    try {
        const [result] = await connection.query("INSERT INTO roles (name) VALUES (?)", [name]);
        const newRoleId = result.insertId;

        if (permissions.length > 0) {
            const [permResults] = await connection.query("SELECT id FROM permissions WHERE name IN (?)", [permissions]);
            if (permResults.length > 0) {
                const values = permResults.map(p => [newRoleId, p.id]);
                await connection.query("INSERT INTO role_permissions (role_id, permission_id) VALUES ?", [values]);
            }
        }
        connection.release();
        res.json({ message: "เพิ่มข้อมูลเรียบร้อย", id: newRoleId });
    } catch (error) {
        connection.release();
        res.status(500).send(error);
    }
});

app.delete("/api/permissions/:id", async (req, res) => {
    try {
        await db.promise().query("DELETE FROM roles WHERE id = ?", [req.params.id]);
        res.json({ message: "ลบข้อมูลเรียบร้อย" });
    } catch (error) { res.status(500).send(error); }
});

app.put("/api/permissions/:id", async (req, res) => {
    const roleId = req.params.id;
    const { name, permissions } = req.body;
    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();
        await connection.query("UPDATE roles SET name = ? WHERE id = ?", [name, roleId]);
        await connection.query("DELETE FROM role_permissions WHERE role_id = ?", [roleId]);
        
        if (permissions.length > 0) {
            const [permResults] = await connection.query("SELECT id FROM permissions WHERE name IN (?)", [permissions]);
            if (permResults.length > 0) {
                const values = permResults.map(p => [roleId, p.id]);
                await connection.query("INSERT INTO role_permissions (role_id, permission_id) VALUES ?", [values]);
            }
        }
        await connection.commit();
        connection.release();
        res.json({ message: "แก้ไขข้อมูลเรียบร้อย" });
    } catch (error) {
        await connection.rollback();
        connection.release();
        res.status(500).send(error);
    }
});

// ==========================================
// PART: ข้อมูลพื้นฐาน (Master Data)
// ==========================================

app.get('/api/roles', async (req, res) => {
    try {
        // ดึง จากตาราง roles เพื่อไปทำ Dropdown
        const [rows] = await db.promise().query("SELECT id, name FROM roles ORDER BY id ASC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
//  1: สำหรับเจ้าหน้าที่ 
// ==========================================
// ==========================================
// 1.1 หา ID ถัดไป 
// ==========================================
app.get('/api/staffs/next-id', async (req, res) => {
    try {
        const [rows] = await db.promise().query(
            "SELECT staff_code FROM staffs WHERE staff_code LIKE 'STF%' ORDER BY CAST(SUBSTRING(staff_code, 4) AS UNSIGNED) DESC LIMIT 1"
        );
        let nextId = 'STF1';
        if (rows.length > 0) {
            const lastCode = rows[0].staff_code; 
            const lastNum = parseInt(lastCode.replace('STF', '')) || 0;
            nextId = `STF${lastNum + 1}`;
        }
        res.json({ nextId });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// ==========================================
// 1.2 เพิ่มเจ้าหน้าที่ 
// ==========================================
app.post('/api/staffs', upload.single('photo'), async (req, res) => {
    const connection = await db.promise().getConnection();
    const photo = req.file ? req.file.filename : null;

    try {
        const { 
            staff_code, prefix_th, first_name_th, 
            last_name_th, email, password, role_id, status 
        } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);
        let finalStaffCode = staff_code;
        
        if (!finalStaffCode) {
            const [lastRows] = await connection.query(
                "SELECT staff_code FROM staffs WHERE staff_code LIKE 'STF%' ORDER BY CAST(SUBSTRING(staff_code, 4) AS UNSIGNED) DESC LIMIT 1"
            );
            if (lastRows.length > 0) {
                const lastNum = parseInt(lastRows[0].staff_code.replace('STF', '')) || 0;
                finalStaffCode = `STF${lastNum + 1}`;
            } else {
                finalStaffCode = 'STF1';
            }
        }

        const sql = `
            INSERT INTO staffs 
            (staff_code, prefix_th, first_name_th, last_name_th, email, password, role_id, photo, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            finalStaffCode, prefix_th, first_name_th, last_name_th, 
            email, hashedPassword, role_id, photo, status || 'active'
        ];

        await connection.query(sql, values);
        res.status(201).json({ message: 'เพิ่มเจ้าหน้าที่เรียบร้อย', staff_code: finalStaffCode });

    } catch (err) {
        if (photo) {
            const deletePath = path.join(__dirname, './uploads/staffs', photo);
            if (fs.existsSync(deletePath)) fs.unlinkSync(deletePath);
        }
        
        console.error("Staff Insert Error:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            const msg = err.sqlMessage;
            let field = "";
            let info = "ข้อมูลซ้ำในระบบ";

            if (msg.includes('email')) {
                field = "email";
                info = "อีเมลนี้ถูกใช้งานไปแล้ว";
            } else if (msg.includes('staff_code')) {
                field = "staff_code";
                info = "รหัสเจ้าหน้าที่ซ้ำ กรุณารีเฟรชหน้าจอ";
            }

            return res.status(400).json({ field, message: info });
        }
        // ----------------------------------------

        res.status(500).json({ message: 'เกิดข้อผิดพลาด: ' + err.message });
    } finally {
        connection.release();
    }
});
// ==========================================
// 1.3 ดึงข้อมูลเจ้าหน้าที่ทั้งหมด 
// ==========================================
app.get('/api/staffs', async (req, res) => {
    try {
        const sql = `
            SELECT s.*, r.name as role_name 
            FROM staffs s 
            LEFT JOIN roles r ON s.role_id = r.id 
            ORDER BY s.staff_code ASC
        `;
        const [results] = await db.promise().query(sql);
        const safeResults = results.map(staff => {
            const { password, ...rest } = staff;
            return rest;
        });

        res.json(safeResults);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});
// ==========================================
// 1.4 ดึงข้อมูลเจ้าหน้าที่รายคน 
// ==========================================
app.get('/api/staffs/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const sql = `
            SELECT s.*, r.name as role_name 
            FROM staffs s
            LEFT JOIN roles r ON s.role_id = r.id
            WHERE s.staff_code = ? OR s.id = ?
        `;
        const [rows] = await db.promise().query(sql, [id, id]);

        if (rows.length === 0) return res.status(404).json({ message: "ไม่พบข้อมูล" });

        const staff = rows[0];
        delete staff.password; 
        res.json(staff);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});
// ==========================================
// 1.5 แก้ไขเจ้าหน้าที่
// ==========================================
app.put('/api/staffs/:id', upload.single('photo'), async (req, res) => {
    const paramId = req.params.id; 
    const connection = await db.promise().getConnection();
    
    try {
        const { 
            prefix_th, first_name_th, last_name_th, 
            email, role_id, status, password, delete_photo 
        } = req.body;


        const [oldRows] = await connection.query("SELECT id, photo, password FROM staffs WHERE staff_code = ? OR id = ?", [paramId, paramId]);
        if (oldRows.length === 0) return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });
        
        const oldData = oldRows[0];
        let newPhoto = oldData.photo;
        let newPassword = oldData.password;

        if (req.file) {
            if (oldData.photo) {
                const oldPath = path.join(__dirname, './uploads/staffs', oldData.photo);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            newPhoto = req.file.filename;
        } else if (delete_photo === "true" || delete_photo === true) {
            if (oldData.photo) {
                const oldPath = path.join(__dirname, './uploads/staffs', oldData.photo);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            newPhoto = null;
        }

        if (password && password.trim() !== "") {
            newPassword = await bcrypt.hash(password, 10);
        }

        const sql = `
            UPDATE staffs SET 
            prefix_th=?, first_name_th=?, last_name_th=?, 
            email=?, role_id=?, status=?, photo=?, password=?
            WHERE id=?
        `;
        
        await connection.query(sql, [
            prefix_th, first_name_th, last_name_th, 
            email, role_id, status, newPhoto, newPassword, 
            oldData.id
        ]);

        res.json({ message: "แก้ไขข้อมูลเรียบร้อย" });

    } catch (err) {
        if (req.file) {
             const newPath = path.join(__dirname, './uploads/staffs', req.file.filename);
             if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
        }
        console.error(err);
        res.status(500).json({ message: "แก้ไขข้อมูลล้มเหลว", error: err.message });
    } finally {
        connection.release();
    }
});
// ==========================================
// 1.6 ลบเจ้าหน้าที่ 
// ==========================================
app.delete('/api/staffs/:id', async (req, res) => {
    const paramId = req.params.id;
    try {
        const [rows] = await db.promise().query("SELECT photo FROM staffs WHERE staff_code = ? OR id = ?", [paramId, paramId]);
        if (rows.length === 0) return res.status(404).json({ message: "ไม่พบข้อมูล" });

        const [result] = await db.promise().query("DELETE FROM staffs WHERE staff_code = ? OR id = ?", [paramId, paramId]);
        
        if (result.affectedRows > 0 && rows[0].photo) {
            const filePath = path.join(__dirname, './uploads/staffs', rows[0].photo);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        res.json({ message: "ลบข้อมูลเรียบร้อย" });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(400).json({ message: "ไม่สามารถลบได้ เนื่องจากข้อมูลนี้ถูกใช้งานอยู่ในระบบ" });
        }
        res.status(500).json({ message: "ไม่สามารถลบได้", error: err.message });
    }
});

// ==========================================
// 2: สำหรับอาจารย์ (Teachers)
// ==========================================

// ==========================================
// ดึงประเภทผู้ใช้งาน (Roles)
// ==========================================
app.get('/api/user-types', async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT id, name FROM roles');
        res.json(rows);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// ==========================================
// 2.1 สร้าง “รหัสอาจารย์อัตโนมัติ” 
// ==========================================
app.get('/api/teachers/next-id', async (req, res) => {
    try {
        // หาค่าตัวเลขที่มากที่สุดจาก teacher_code เดิม
        const [lastTeacher] = await db.promise().query(
            "SELECT teacher_code FROM teachers WHERE teacher_code LIKE 'TCH%' ORDER BY CAST(SUBSTRING(teacher_code, 4) AS UNSIGNED) DESC LIMIT 1"
        );
        
        let nextNumber = 1;
        if (lastTeacher.length > 0) {
            const lastCode = lastTeacher[0].teacher_code; 
            nextNumber = parseInt(lastCode.replace('TCH', '')) + 1;
        }
        
        res.json({ nextId: `TCH${nextNumber}` });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// ==========================================
// 2.2 เพิ่มอาจารย์ 
// ==========================================
app.post('/api/teachers', upload.single('photo'), async (req, res) => {
    const connection = await db.promise().getConnection();
    const photo = req.file ? req.file.filename : null;

    try {
        await connection.beginTransaction(); 
        const { 
            prefixTH, firstNameTH, lastNameTH, 
            prefixEN, firstNameEN, lastNameEN, 
            shortName, email, password, 
            userTypeId, degrees, status 
        } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);
        const [lastTeacher] = await connection.query(
            "SELECT teacher_code FROM teachers WHERE teacher_code LIKE 'TCH%' ORDER BY CAST(SUBSTRING(teacher_code, 4) AS UNSIGNED) DESC LIMIT 1"
        );
        
        let nextNumber = 1;
        if (lastTeacher.length > 0) {
            const lastCode = lastTeacher[0].teacher_code; 
            nextNumber = parseInt(lastCode.replace('TCH', '')) + 1;
        }
        const teacherCode = `TCH${nextNumber}`; 

        const sqlTeacher = `INSERT INTO teachers 
            (teacher_code, prefix_th, first_name_th, last_name_th, prefix_en, first_name_en, last_name_en, short_name, email, password, photo, role_id, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const [result] = await connection.query(sqlTeacher, [
            teacherCode, prefixTH, firstNameTH, lastNameTH, 
            prefixEN, firstNameEN, lastNameEN, 
            shortName, email, hashedPassword, 
            photo, userTypeId, status || 'active'
        ]);

        const newTeacherId = result.insertId;

        let degreeList = [];
        try { 
            degreeList = typeof degrees === 'string' ? JSON.parse(degrees) : degrees; 
        } catch (e) { }

        if (Array.isArray(degreeList) && degreeList.length > 0) {
            const degreeValues = degreeList.map(d => [
                newTeacherId, d.degree_level, d.degree_name, d.institution, d.major, d.graduation_year
            ]);
            await connection.query(
                "INSERT INTO teacher_degrees (teacher_id, degree_level, degree_name, institution, major, graduation_year) VALUES ?", 
                [degreeValues]
            );
        }

        await connection.commit(); 
        res.json({ message: 'บันทึกข้อมูลสำเร็จ', teacherCode });

    } catch (err) {
        await connection.rollback(); 
        if (photo) {
            const photoPath = path.join(__dirname, './uploads/teachers', photo);
            if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
        }
        if (err.code === 'ER_DUP_ENTRY') {
            const msg = err.sqlMessage;
            let field = "";
            let info = "ข้อมูลซ้ำในระบบ";

            if (msg.includes('email')) { field = "email"; info = "อีเมลนี้ถูกใช้งานไปแล้ว"; }
            else if (msg.includes('short_name')) { field = "shortName"; info = "ชื่อย่อนี้ถูกใช้งานไปแล้ว"; }
            else if (msg.includes('teacher_code')) { field = "id"; info = "รหัสอาจารย์ซ้ำ"; }

            return res.status(400).json({ field, message: info });
        }

        res.status(500).json({ message: 'เกิดข้อผิดพลาด: ' + err.message });
    } finally {
        connection.release();
    }
});

// ==========================================
// 2.3 ดึงอาจารย์รายคน 
// ==========================================
app.get('/api/teachers/:id', async (req, res) => {
    try {
        const id = req.params.id; 
        const sql = `SELECT * FROM teachers WHERE teacher_code = ? OR id = ?`;
        const [teachers] = await db.promise().query(sql, [id, id]);

        if (teachers.length === 0) return res.status(404).json({ message: "ไม่พบข้อมูล" });

        const teacher = teachers[0];
        const [degrees] = await db.promise().query(
            `SELECT degree_level, degree_name, institution, major, graduation_year 
             FROM teacher_degrees WHERE teacher_id = ?`, [teacher.id]
        );

        teacher.degrees = degrees;
        delete teacher.password; 
        
        res.json(teacher);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// ==========================================
// 2.4 แก้ไขอาจารย์ 
// ==========================================
app.put('/api/teachers/:id', upload.single('photo'), async (req, res) => {
    const teacherCode = req.params.id;
    const connection = await db.promise().getConnection();
    const newPhoto = req.file ? req.file.filename : undefined;

    try {
        await connection.beginTransaction();

        const { prefixTH, firstNameTH, lastNameTH, prefixEN, firstNameEN, lastNameEN, shortName, email, password, userTypeId, degrees, status } = req.body;
        if (newPhoto) {
            const [oldData] = await connection.query("SELECT photo FROM teachers WHERE teacher_code = ?", [teacherCode]);
            if (oldData.length > 0 && oldData[0].photo) {
                const oldPath = path.join(__dirname, './uploads/teachers', oldData[0].photo);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
        }

        let sql = `UPDATE teachers SET prefix_th=?, first_name_th=?, last_name_th=?, prefix_en=?, first_name_en=?, last_name_en=?, short_name=?, email=?, role_id=?, status=?`;
        let params = [prefixTH, firstNameTH, lastNameTH, prefixEN, firstNameEN, lastNameEN, shortName, email, userTypeId, status];

        if (password && password.trim() !== "") {
            const hashedPassword = await bcrypt.hash(password, 10);
            sql += `, password=?`;
            params.push(hashedPassword);
        }

        if (newPhoto) {
            sql += `, photo=?`;
            params.push(newPhoto);
        }

        sql += ` WHERE teacher_code=?`;
        params.push(teacherCode);

        await connection.query(sql, params);

        const [tRows] = await connection.query('SELECT id FROM teachers WHERE teacher_code = ?', [teacherCode]);
        const teacherId = tRows[0].id;

        await connection.query('DELETE FROM teacher_degrees WHERE teacher_id = ?', [teacherId]);

        let degreeList = [];
        try { 
            degreeList = typeof degrees === 'string' ? JSON.parse(degrees) : degrees; 
        } catch (e) { }
        
        if (Array.isArray(degreeList) && degreeList.length > 0) {
            const degreeValues = degreeList.map(d => [teacherId, d.degree_level, d.degree_name, d.institution, d.major, d.graduation_year]);
            await connection.query(
                "INSERT INTO teacher_degrees (teacher_id, degree_level, degree_name, institution, major, graduation_year) VALUES ?", 
                [degreeValues]
            );
        }

        await connection.commit();
        res.json({ message: "แก้ไขข้อมูลเรียบร้อย" });
    } catch (err) {
        await connection.rollback();
        if (newPhoto) {
            const photoPath = path.join(__dirname, './uploads/teachers', newPhoto);
            if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
        }

        if (err.code === 'ER_DUP_ENTRY') {
            const msg = err.sqlMessage;
            let field = msg.includes('email') ? "email" : (msg.includes('short_name') ? "shortName" : "unknown");
            return res.status(400).json({ field, message: "ข้อมูลนี้ถูกใช้งานไปแล้ว" });
        }
        
        res.status(500).json({ message: "แก้ไขข้อมูลล้มเหลว", error: err.message });
    } finally {
        connection.release();
    }
});

// ==========================================
// 2.5 ลบอาจารย์ 
// ==========================================
app.delete('/api/teachers/:id', async (req, res) => {
    const teacherCode = req.params.id; 
    try {
        const [oldData] = await db.promise().query("SELECT photo FROM teachers WHERE teacher_code = ?", [teacherCode]);
        const [result] = await db.promise().query("DELETE FROM teachers WHERE teacher_code = ?", [teacherCode]);
        
        if (result.affectedRows === 0) return res.status(404).json({ message: "ไม่พบข้อมูลที่ต้องการลบ" });

        if (oldData.length > 0 && oldData[0].photo) {
            const filePath = path.join(__dirname, './uploads/teachers', oldData[0].photo);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        res.json({ message: "ลบข้อมูลเรียบร้อย" });
    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2') 
            return res.status(400).json({ message: "ไม่สามารถลบได้ เนื่องจากข้อมูลถูกใช้งานในส่วนอื่นอยู่" });
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 2.6 ดึงข้อมูลอาจารย์ทั้งหมด
// ==========================================
app.get('/api/teachers', async (req, res) => {
    try {
        const sql = `SELECT t.*, r.name as role_name 
                     FROM teachers t 
                     LEFT JOIN roles r ON t.role_id = r.id 
                     ORDER BY CAST(SUBSTRING(t.teacher_code, 4) AS UNSIGNED) ASC`;
        const [results] = await db.promise().query(sql);
        res.json(results);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// ==========================================
// 3. RESEARCH  (งานวิจัย)
// ==========================================
// ==========================================
// 3.1ฟังก์ชันแก้ปัญหาภาษาต่างดาว (สำหรับชื่อไฟล์ต้นฉบับ)
// ==========================================
const fixThaiFilename = (originalname) => {
    if (!originalname) return "";
    return Buffer.from(originalname, 'latin1').toString('utf8');
};
// ==========================================
// 3.2 นับจำนวนผลงานของอาจารย์รายคน แยกตามประเภทผลงาน 
// ==========================================
app.get('/api/researches/count', async (req, res) => {
    try {
        const { teacher_id, type } = req.query;
        const tables = { 'research': 'researches', 'journal': 'journals', 'conference': 'conferences', 'book': 'books' };
        const tableName = tables[type];
        if (!tableName) return res.status(400).json({ message: "Invalid type" });

        const [rows] = await db.promise().query(`SELECT COUNT(*) as count FROM ${tableName} WHERE teacher_id = ?`, [teacher_id]);
        res.json({ count: rows[0].count });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
// ==========================================
// 3.3 ดึงข้อมูลผลงานทั้งหมดของอาจารย์ 
// ==========================================
app.get('/api/research/teacher/:teacherId', async (req, res) => {
    const { teacherId } = req.params;
    const getAuthorsQuery = (table, fk) => `
        COALESCE((SELECT JSON_ARRAYAGG(JSON_OBJECT(
            'id', a.id, 
            'prefix', a.prefix, 
            'prefix_en', a.prefix_en,       
            'first_name', a.first_name,     
            'first_name_en', a.first_name_en, 
            'last_name', a.last_name,       
            'last_name_en', a.last_name_en,   
            'position', a.position
        )) FROM ${table} a WHERE a.${fk} = main.id), '[]')
    `;

    const getFilesQuery = (refTable) => `
        COALESCE((SELECT JSON_ARRAYAGG(JSON_OBJECT(
            'id', f.id, 
            'file_name', f.file_name, 
            'file_path', f.file_path
        )) FROM common_files f WHERE f.ref_id = main.id AND f.ref_table = '${refTable}'), '[]')
    `;

    let allWorks = [];

    // 1. Researches 
    try {
        const [researches] = await db.promise().query(`
            SELECT main.*, 'research' as type,
            ${getAuthorsQuery('research_authors', 'research_id')} AS authors,
            ${getFilesQuery('research')} AS files
            FROM researches main WHERE main.teacher_id = ?
        `, [teacherId]);
        allWorks.push(...researches);
    } catch (e) { console.error("Error fetching Researches:", e.message); }

    // 2. Journals
    try {
        const [journals] = await db.promise().query(`
            SELECT main.*, 'journal' as type,
            ${getAuthorsQuery('journal_authors', 'journal_id')} AS authors,
            ${getFilesQuery('journal')} AS files
            FROM journals main WHERE main.teacher_id = ?
        `, [teacherId]);
        allWorks.push(...journals);
    } catch (e) { console.error("Error fetching Journals:", e.message); }

    // 3. Conferences
    try {
        const [conferences] = await db.promise().query(`
            SELECT main.*, 'conference' as type,
            ${getAuthorsQuery('conference_authors', 'conference_id')} AS authors,
            ${getFilesQuery('conference')} AS files
            FROM conferences main WHERE main.teacher_id = ?
        `, [teacherId]);
        allWorks.push(...conferences);
    } catch (e) { console.error("Error fetching Conferences:", e.message); }

    // 4. Books
    try {
        const [books] = await db.promise().query(`
            SELECT main.*, 'book' as type,
            ${getAuthorsQuery('book_authors', 'book_id')} AS authors,
            ${getFilesQuery('book')} AS files
            FROM books main WHERE main.teacher_id = ?
        `, [teacherId]);
        allWorks.push(...books);
    } catch (e) { console.error("Error fetching Books:", e.message); }

    // เรียงปีล่าสุดขึ้นก่อน
    allWorks.sort((a, b) => (Number(b.academic_year) || 0) - (Number(a.academic_year) || 0));

    res.json(allWorks);
});
// ==========================================
// 3.4 สร้างงานวิจัยใหม่ 
// ==========================================
app.post('/api/research', upload.array('files'), async (req, res) => {
    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();
        const { type, teacher_id, work_code, authors, ...data } = req.body;
        let insertId = null;

        if (type === 'research') {
            const sql = `INSERT INTO researches 
                (teacher_id, work_code, research_name, research_name_en, academic_year, volume, order_no, location, edition_year, budget, organization, project_name, start_date, publish_date, external_link) 
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
            
            const [result] = await connection.query(sql, [
                teacher_id, 
                work_code, 
                data.research_name,       
                data.research_name_en,
                data.academic_year,    
                data.volume, 
                data.order_no,            
                data.location, 
                data.edition_year,        
                data.budget || 0, 
                data.organization, 
                data.project_name,       
                data.start_date || null, 
                data.publish_date || null, 
                data.external_link 
            ]);
            insertId = result.insertId;
        } 
        else if (type === 'journal') {
           const sql = `INSERT INTO journals (teacher_id, work_code, title_name, title_name_en, journal_name, journal_name_en, academic_year, author_org, volume, edition_year, page_no, document_link) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;
           const [result] = await connection.query(sql, [
               teacher_id, 
               work_code, 
               data.title_name,     
               data.title_name_en, 
               data.journal_name, 
               data.journal_name_en, 
               data.academic_year, 
               data.author_org, 
               data.volume, 
               data.edition_year, 
               data.page_no, 
               data.document_link
            ]);
           insertId = result.insertId;
        } else if (type === 'conference') {
           const sql = `INSERT INTO conferences (teacher_id, work_code, article_title, article_title_en, conference_name, conference_name_en, conference_level, country, academic_year, location, edition_year, conference_date, document_link) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`;
           const [result] = await connection.query(sql, [
               teacher_id, 
               work_code, 
               data.article_title,   
               data.article_title_en, 
               data.conference_name, 
               data.conference_name_en, 
               data.conference_level, 
               data.country, 
               data.academic_year, 
               data.location, 
               data.edition_year, 
               data.conference_date || null, 
               data.document_link
            ]);
           insertId = result.insertId;
        } else if (type === 'book') {
           const sql = `INSERT INTO books (teacher_id, work_code, book_name, book_name_en, semester, academic_year, subject, credits, document_link) VALUES (?,?,?,?,?,?,?,?,?)`;
           const [result] = await connection.query(sql, [
               teacher_id, 
               work_code, 
               data.book_name,      
               data.book_name_en, 
               data.semester, 
               data.academic_year, 
               data.subject, 
               data.credits, 
               data.document_link
            ]);
           insertId = result.insertId;
        }

       if (authors && insertId) {
            const authorList = JSON.parse(authors);
            
            if (authorList.length > 0) { 
                const config = { research:['research_authors','research_id'], journal:['journal_authors','journal_id'], conference:['conference_authors','conference_id'], book:['book_authors','book_id'] };
                const [table, fk] = config[type];
                
                const values = authorList.map(a => [
                    insertId, 
                    a.prefix, 
                    a.prefix_en || a.prefixEn || '', 
                    a.first_name || a.firstName, 
                    a.first_name_en || a.firstNameEn || '', 
                    a.last_name || a.lastName, 
                    a.last_name_en || a.lastNameEn || '', 
                    a.position
                ]);
                
                await connection.query(`INSERT INTO ${table} (${fk}, prefix, prefix_en, first_name, first_name_en, last_name, last_name_en, position) VALUES ?`, [values]);
            }
        }

        if (req.files?.length > 0) {
            const fileValues = req.files.map(f => [insertId, type, Buffer.from(f.originalname, 'latin1').toString('utf8'), f.filename]);
            await connection.query(`INSERT INTO common_files (ref_id, ref_table, file_name, file_path) VALUES ?`, [fileValues]);
        }

        await connection.commit();
        res.status(201).json({ message: 'Success', id: insertId });
    } catch (err) {
        await connection.rollback();
        console.error("Create Error:", err);
        res.status(500).json({ error: err.message });
    } finally { connection.release(); }
});

// ==========================================
// 3.5ลบข้อมูลผลงาน 
// ==========================================
app.delete('/api/research/:type/:id', async (req, res) => {
    const { type, id } = req.params;

    const config = {
        research: { main: 'researches', auth: 'research_authors', fk: 'research_id' },
        journal: { main: 'journals', auth: 'journal_authors', fk: 'journal_id' },
        conference: { main: 'conferences', auth: 'conference_authors', fk: 'conference_id' },
        book: { main: 'books', auth: 'book_authors', fk: 'book_id' } 
    };

    if (!config[type]) {
        return res.status(400).json({ message: "ประเภทผลงานไม่ถูกต้อง" });
    }

    const { main: mainTable, auth: authorTable, fk: fkColumn } = config[type];
    const connection = await db.promise().getConnection();

    try {
        await connection.beginTransaction();

        // 1. ลบข้อมูลในตารางผู้แต่ง 
        await connection.query(`DELETE FROM ${authorTable} WHERE ${fkColumn} = ?`, [id]);

        // 2. จัดการไฟล์แนบ 
        const [files] = await connection.query(
            `SELECT file_path FROM common_files WHERE ref_id = ? AND ref_table = ?`, 
            [id, type]
        );
        
        const path = require('path');
        const fs = require('fs');

        const uploadDir = type === 'book' ? 'books' : 'researches';

        for (const file of files) {
            const filePath = path.join(__dirname, `./uploads/${uploadDir}`, file.file_path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath); 
            }
        }

        // 3. ลบข้อมูลไฟล์
        await connection.query(`DELETE FROM common_files WHERE ref_id = ? AND ref_table = ?`, [id, type]);

        // 4. ลบข้อมูลในตารางหลัก 
        await connection.query(`DELETE FROM ${mainTable} WHERE id = ?`, [id]);

        await connection.commit();
        res.json({ message: "ลบข้อมูลสำเร็จ" });

    } catch (err) {
        await connection.rollback();
        console.error("Delete Error:", err);
        res.status(500).json({ message: "ลบไม่สำเร็จ: " + err.message });
    } finally {
        connection.release();
    }
});
// ==========================================
// 3.6 PUT แก้ไขข้อมูล 
// ==========================================
app.put('/api/research/:type/:id', upload.array('files'), async (req, res) => {
    
    const { type: typeParam, id } = req.params; 
    const connection = await db.promise().getConnection();
    
    try {
        await connection.beginTransaction();
        const { type, authors, existingFiles, ...data } = req.body;

        if (type === 'research') {
            await connection.query(
                `UPDATE researches SET 
                    research_name=?, research_name_en=?, academic_year=?, volume=?, 
                    order_no=?, location=?, edition_year=?, budget=?, organization=?, 
                    project_name=?, start_date=?, publish_date=?, external_link=? 
                WHERE id=?`, 
                [
                    data.research_name,       
                    data.research_name_en,    
                    data.academic_year,      
                    data.volume,
                    data.order_no,            
                    data.location,
                    data.edition_year,
                    data.budget,
                    data.organization,
                    data.project_name,       
                    data.start_date,          
                    data.publish_date,            
                    data.external_link,           
                    id
                ]
            );
        }
        else if (type === 'journal') {
             await connection.query(
                `UPDATE journals SET 
                    title_name=?, title_name_en=?, journal_name=?, journal_name_en=?, 
                    academic_year=?, author_org=?, volume=?, edition_year=?, page_no=?, document_link=? 
                WHERE id=?`, 
                [
                    data.title_name,         
                    data.title_name_en,
                    data.journal_name,
                    data.journal_name_en,
                    data.academic_year,     
                    data.author_org,
                    data.volume,
                    data.edition_year,
                    data.page_no,              
                    data.document_link,    
                    id
                ]
            );
        }
        else if (type === 'conference') {
             await connection.query(
                `UPDATE conferences SET 
                    article_title=?, article_title_en=?, conference_name=?, conference_name_en=?, 
                    conference_level=?, country=?, academic_year=?, location=?, edition_year=?, conference_date=?, document_link=? 
                WHERE id=?`,
                [
                    data.article_title,      
                    data.article_title_en,
                    data.conference_name,
                    data.conference_name_en,
                    data.conference_level,
                    data.country,
                    data.academic_year,      
                    data.location,           
                    data.edition_year,
                    data.conference_date,    
                    data.document_link,       
                    id
                ]
            );
        }
        else if (type === 'book') {
            await connection.query(
                `UPDATE books SET 
                    book_name=?, book_name_en=?, semester=?, academic_year=?, 
                    subject=?, credits=?, document_link=? 
                WHERE id=?`,
                [
                    data.book_name,         
                    data.book_name_en,      
                    data.semester,
                    data.academic_year,     
                    data.subject,
                    data.credits,
                    data.document_link,       
                    id
                ]
            );
        }

        const config = { 
            research:['research_authors','research_id'], 
            journal:['journal_authors','journal_id'], 
            conference:['conference_authors','conference_id'], 
            book:['book_authors','book_id'] 
        };
        const [table, fk] = config[type];
        
        await connection.query(`DELETE FROM ${table} WHERE ${fk} = ?`, [id]);
        
        const authorList = JSON.parse(authors || "[]");
        if (authorList.length > 0) {
            const values = authorList.map(a => [
                id, 
                a.prefix, 
                a.prefix_en || a.prefixEn || '',     
                a.firstName || a.first_name || '',   
                a.firstNameEn || a.first_name_en || '', 
                a.lastName || a.last_name || '',     
                a.lastNameEn || a.last_name_en || '',   
                a.position
            ]);
            
            await connection.query(
                `INSERT INTO ${table} (${fk}, prefix, prefix_en, first_name, first_name_en, last_name, last_name_en, position) VALUES ?`, 
                [values]
            );
        }

        if (req.files?.length > 0) {
            const fileValues = req.files.map(f => [
                id, 
                type, 
                Buffer.from(f.originalname, 'latin1').toString('utf8'),
                f.filename
            ]);
            await connection.query(`INSERT INTO common_files (ref_id, ref_table, file_name, file_path) VALUES ?`, [fileValues]);
        }

        await connection.commit();
        res.json({ message: 'Update Success' });

    } catch (err) {
        await connection.rollback();
        console.error("Update Error:", err);
        res.status(500).json({ error: err.message });
    } finally { 
        connection.release(); 
    }
});
// ==========================================
// 3.7 ดึงรายละเอียดผลงานเพื่อแก้ไข 
// ==========================================
app.get('/api/research/:type/:id', async (req, res) => {
    const { type, id } = req.params;

    const config = {
        research:   { table: 'researches',   auth: 'research_authors',   fk: 'research_id' },
        journal:    { table: 'journals',     auth: 'journal_authors',    fk: 'journal_id' },
        conference: { table: 'conferences',  auth: 'conference_authors', fk: 'conference_id' },
        book:       { table: 'books',        auth: 'book_authors',       fk: 'book_id' }
    };

    if (!config[type]) {
        return res.status(400).json({ message: "Invalid type" });
    }

    try {
        const { table, auth, fk } = config[type];

        // 1. ดึงข้อมูลหลัก
        const [rows] = await db.promise().query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูล" });
        }
        
        const data = rows[0];

        // 2. ดึงข้อมูลผู้แต่ง 
        const [authors] = await db.promise().query(
            `SELECT * FROM ${auth} WHERE ${fk} = ?`, 
            [id]
        );
        data.authors = authors; 

        // 3. ดึงไฟล์แนบ
        const [files] = await db.promise().query(
            `SELECT * FROM common_files WHERE ref_id = ? AND ref_table = ?`, 
            [id, type]
        );
        data.files = files;

        res.json(data);

    } catch (err) {
        console.error("Error fetching detail:", err);
        res.status(500).json({ message: "Error loading data: " + err.message });
    }
});


// ==========================================
// 4: สำหรับการอบรม (Staff Trainings)
// ==========================================

// ==========================================
// 4.1 สร้าง ID อัตโนมัติ 
// ==========================================
app.get('/api/staff-trainings/next-id/:staffId', async (req, res) => {
    const { staffId } = req.params;
    try {
        const [staffs] = await db.promise().query("SELECT staff_code FROM staffs WHERE id = ?", [staffId]);
        
        if (staffs.length === 0) {
            return res.status(404).json({ message: "Staff not found" });
        }
        
        const staffCode = staffs[0].staff_code; 
        const [countResult] = await db.promise().query(
            "SELECT COUNT(*) as count FROM staff_trainings WHERE staff_id = ?", 
            [staffId]
        );
        
        const nextCount = countResult[0].count + 1;
        const paddedCount = String(nextCount).padStart(3, '0');
        const nextId = `T${staffCode}${paddedCount}`; 
        
        res.json({ work_code: nextId });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error generating ID" });
    }
});
// ==========================================
// 4.2 บันทึกข้อมูล + อัปโหลดไฟล์ (Staff)
// ==========================================
app.post('/api/staff-trainings', upload.array('files'), async (req, res) => {
    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();

        const { 
            staff_id, work_code, academic_year, training_type, training_name, 
            location, total_hours, description, start_date, end_date 
        } = req.body;

        const [result] = await connection.query(
            `INSERT INTO staff_trainings 
            (staff_id, work_code, academic_year, training_type, training_name, location, total_hours, description, start_date, end_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [staff_id, work_code, academic_year, training_type, training_name, location, total_hours, description, start_date, end_date]
        );

        const trainingId = result.insertId;

        if (req.files && req.files.length > 0) {
            const fileValues = req.files.map(file => {
                const fixedName = Buffer.from(file.originalname, 'latin1').toString('utf8');
                return [ trainingId, fixedName, file.filename ];
            });
            await connection.query(
                `INSERT INTO staff_training_files (training_id, file_name, file_path) VALUES ?`,
                [fileValues]
            );
        }

        await connection.commit();
        res.status(201).json({ message: "บันทึกข้อมูลสำเร็จ", trainingId });

    } catch (error) {
        await connection.rollback();
        console.error("Transaction Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
    } finally {
        connection.release();
    }
});
// ==========================================
//4.3สำหรับดึง “รายละเอียดการอบรมของเจ้าหน้าที่ 1 รายการ 
// ==========================================
app.get('/api/staff-trainings/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const [rows] = await db.promise().query("SELECT * FROM staff_trainings WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ message: "Not found" });
    
        const training = rows[0];
        const [files] = await db.promise().query("SELECT * FROM staff_training_files WHERE training_id = ?", [id]);
        training.files = files;

        res.json(training);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ==========================================
// 4.4 ดึงข้อมูลการอบรม "เจ้าหน้าที่" ทั้งหมด
// ==========================================
app.get('/api/staff-trainings', async (req, res) => {
    try {
        const [rows] = await db.promise().query("SELECT * FROM staff_trainings ORDER BY work_code ASC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ==========================================
// 4.5 แก้ไขข้อมูลอบรมเจ้าหน้าที่ (Staff)
// ==========================================
app.put('/api/staff-trainings/:id', upload.array('files'), async (req, res) => {
    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const { 
            academic_year, training_type, training_name, location, 
            total_hours, description, start_date, end_date 
        } = req.body;
        
        await connection.query(
            `UPDATE staff_trainings SET 
            academic_year=?, training_type=?, training_name=?, location=?, 
            total_hours=?, description=?, start_date=?, end_date=? 
            WHERE id=?`, 
            [academic_year, training_type, training_name, location, total_hours, description, start_date, end_date, id]
        );
        
        if (req.files && req.files.length > 0) {
            const fileValues = req.files.map(file => {
                const fixedName = Buffer.from(file.originalname, 'latin1').toString('utf8');
                return [ id, fixedName, file.filename ];
            });

            await connection.query(
                `INSERT INTO staff_training_files (training_id, file_name, file_path) VALUES ?`,
                [fileValues]
            );
        }

        await connection.commit();
        res.json({ message: "อัปเดตข้อมูลสำเร็จ" });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});
// ==========================================
// 4.6ลบไฟล์ Staff
// ==========================================
app.delete('/api/staff-files/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        await db.promise().query("DELETE FROM staff_training_files WHERE id = ?", [fileId]);
        res.json({ message: "ลบไฟล์สำเร็จ" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ==========================================
// 5:สำหรับการอบรมอาจารย์ 
// ==========================================

// ==========================================
// 5.1 สร้าง ID อัตโนมัติ 
// ==========================================
app.get('/api/teacher-trainings/next-id/:teacherId', async (req, res) => {
    const { teacherId } = req.params;
    console.log("Request ID for teacher:", teacherId); 

    try {
        const [teachers] = await db.promise().query("SELECT teacher_code FROM teachers WHERE id = ?", [teacherId]);
        
        if (teachers.length === 0) {
            console.log("Teacher not found");
            return res.status(404).json({ message: "Teacher not found" });
        }
        
        const teacherCode = teachers[0].teacher_code; 

        const [countResult] = await db.promise().query(
            "SELECT COUNT(*) as count FROM teacher_trainings WHERE teacher_id = ?", 
            [teacherId]
        );
        
        const nextCount = countResult[0].count + 1;
        const paddedCount = String(nextCount).padStart(3, '0');
        const nextId = `T${teacherCode}${paddedCount}`;
        
        console.log("Generated ID:", nextId); 
        res.json({ work_code: nextId });

    } catch (error) {
        console.error("Database Error:", error); 
        res.status(500).json({ message: "Error generating ID", error: error.message });
    }
});
// ==========================================
// 5.2 บันทึกข้อมูล 
// ==========================================
app.post('/api/teacher-trainings', upload.array('files'), async (req, res) => {
    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();
        const { 
            teacher_id, work_code, academic_year, training_type, training_name, 
            location, total_hours, description, start_date, end_date 
        } = req.body;


        const [result] = await connection.query(
            `INSERT INTO teacher_trainings 
            (teacher_id, work_code, academic_year, training_type, training_name, location, total_hours, description, start_date, end_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [teacher_id, work_code, academic_year, training_type, training_name, location, total_hours, description, start_date, end_date]
        );

        const trainingId = result.insertId;
        if (req.files && req.files.length > 0) {
            const fileValues = req.files.map(file => {
                const fixedName = Buffer.from(file.originalname, 'latin1').toString('utf8');
                return [ trainingId, fixedName, file.filename ];
            });
            await connection.query(
                `INSERT INTO teacher_training_files (training_id, file_name, file_path) VALUES ?`,
                [fileValues]
            );
        }

        await connection.commit();
        res.status(201).json({ message: "บันทึกข้อมูลสำเร็จ", trainingId });

    } catch (error) {
        await connection.rollback();
        console.error("Error:", error);
        res.status(500).json({ message: "บันทึกข้อมูลล้มเหลว", error: error.message });
    } finally {
        connection.release();
    }
});
// ==========================================
// 5.3 ดึงข้อมูลการอบรม "อาจารย์" ทั้งหมด
// ==========================================
app.get('/api/teacher-trainings', async (req, res) => {
    try {
        const [rows] = await db.promise().query("SELECT * FROM teacher_trainings ORDER BY start_date DESC");
        
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ==========================================
// 5.4 ลบข้อมูลอบรมอาจารย์ 
// ==========================================
app.delete('/api/teacher-trainings/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.promise().query("DELETE FROM teacher_trainings WHERE id = ?", [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูล" });
        }
        res.json({ message: "ลบข้อมูลสำเร็จ" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ==========================================
// 5.5 ลบข้อมูลอบรมเจ้าหน้าที่ 
// ==========================================
app.delete('/api/staff-trainings/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.promise().query("DELETE FROM staff_trainings WHERE id = ?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "ไม่พบข้อมูล" });
        res.json({ message: "ลบข้อมูลสำเร็จ" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ==========================================
// 5.6 ดึงข้อมูลอบรมรายชิ้น 
// ==========================================
app.get('/api/teacher-trainings/:id', async (req, res) => {
    try {
        const id = req.params.id;
        // 1. ดึงข้อมูลหลัก
        const [rows] = await db.promise().query("SELECT * FROM teacher_trainings WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ message: "Not found" });
        
        const training = rows[0];

        // 2. ดึงไฟล์แนบ 
        const [files] = await db.promise().query("SELECT * FROM teacher_training_files WHERE training_id = ?", [id]);
        training.files = files; 

        res.json(training);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 5.7 แก้ไขข้อมูลอบรมอาจารย์ 
// ==========================================
app.put('/api/teacher-trainings/:id', upload.array('files'), async (req, res) => {
    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const { 
            academic_year, training_type, training_name, location, 
            total_hours, description, start_date, end_date 
        } = req.body;
        
        await connection.query(
            `UPDATE teacher_trainings SET 
            academic_year=?, training_type=?, training_name=?, location=?, 
            total_hours=?, description=?, start_date=?, end_date=? 
            WHERE id=?`,
            [academic_year, training_type, training_name, location, total_hours, description, start_date, end_date, id]
        );

        if (req.files && req.files.length > 0) {
            const fileValues = req.files.map(file => {
                const fixedFileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
                return [ id, fixedFileName, file.filename ];
            });

            await connection.query(
                `INSERT INTO teacher_training_files (training_id, file_name, file_path) VALUES ?`,
                [fileValues]
            );
        }

        await connection.commit();
        res.json({ message: "อัปเดตข้อมูลสำเร็จ" });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});
// ==========================================
// 5.8 ลบไฟล์ Teacher
// ==========================================
app.delete('/api/teacher-files/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        await db.promise().query("DELETE FROM teacher_training_files WHERE id = ?", [fileId]);
        res.json({ message: "ลบไฟล์สำเร็จ" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 6  สร้างแบบสอบถาม
// ==========================================
app.post('/api/surveys', async (req, res) => {
    let connection;
    try {
        connection = await db.promise().getConnection(); 
        await connection.beginTransaction();

        const { title, academicYear, targetGroup, isActive, startAt, endAt, allowedYears, mainTopics } = req.body;
        const randomId = generateRandomId();
        const randomCode = req.body.code || 'SV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const [surveyRes] = await connection.query(
            `INSERT INTO surveys (id, code, title, academic_year, target_group, is_active, start_at, end_at, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [randomId, randomCode, title, academicYear, targetGroup, isActive, startAt, endAt]
        );

        const surveyId = randomId;
        const yearsToSave = allowedYears || req.body.allowedUsers;
        if (targetGroup === 'student' && yearsToSave && yearsToSave.length > 0) {
            const yearValues = yearsToSave.map(year => [surveyId, year]);
            await connection.query(
                `INSERT INTO survey_student_years (survey_id, year_prefix) VALUES ?`,
                [yearValues]
            );
        }

        if (mainTopics && mainTopics.length > 0) {
            for (let i = 0; i < mainTopics.length; i++) {
                const topic = mainTopics[i];
                const topicRandomId = generateRandomId() + i; 

                const [topicRes] = await connection.query(
                    `INSERT INTO survey_topics (id, survey_id, topic_name, order_index) VALUES (?, ?, ?, ?)`,
                    [topicRandomId, surveyId, topic.title, i + 1]
                );

                if (topic.subTopics && topic.subTopics.length > 0) {
                    const questionValues = topic.subTopics.map((sub, idx) => [
                        generateRandomId() + idx + (i * 10), 
                        topicRandomId, 
                        sub.title, 
                        idx + 1
                    ]);
                    await connection.query(
                        `INSERT INTO survey_questions (id, topic_id, question_text, order_index) VALUES ?`,
                        [questionValues]
                    );
                }
            }
        }

        await connection.commit();
        res.json({ success: true, message: "สร้างแบบสอบถามสำเร็จ", surveyId: surveyId });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Save Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาด: " + error.message });
    } finally {
        if (connection) connection.release(); 
    }
});

// ==========================================
// 6.1  ดึงรายชื่อแบบสอบถามทั้งหมด (Admin/Teacher)
// ==========================================
app.get('/api/surveys', async (req, res) => {
    try {
        const sql = `
            SELECT 
                s.*, 
                COUNT(DISTINCT r.id) as response_count,
                (
                    SELECT AVG(rd.score) 
                    FROM response_details rd 
                    JOIN survey_responses sr_sub ON rd.response_id = sr_sub.id 
                    WHERE sr_sub.survey_id = s.id
                ) as average_score,
                (
                    SELECT GROUP_CONCAT(year_prefix) 
                    FROM survey_student_years 
                    WHERE survey_id = s.id
                ) as allowed_years
            FROM surveys s
            LEFT JOIN survey_responses r ON s.id = r.survey_id
            GROUP BY s.id
            ORDER BY s.created_at DESC
        `;

        const [results] = await db.promise().query(sql);
        const formattedResults = results.map(survey => ({
            ...survey,
            average_score: survey.average_score ? parseFloat(survey.average_score) : 0,
            response_count: survey.response_count || 0,
            allowedYears: survey.allowed_years ? survey.allowed_years.split(',') : []
        }));
        
        res.json(formattedResults);

    } catch (error) {
        console.error("Error fetching surveys:", error);
        res.status(500).json({ message: "Error fetching surveys" });
    }
});

// ==========================================
// 6.2  ดึงรายละเอียดแบบสอบถาม 
// ==========================================
app.get('/api/surveys/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [surveys] = await db.promise().query('SELECT * FROM surveys WHERE id = ?', [id]);
        if (surveys.length === 0) return res.status(404).json({ message: "ไม่พบข้อมูล" });
        const survey = surveys[0];
        const [years] = await db.promise().query('SELECT year_prefix FROM survey_student_years WHERE survey_id = ?', [id]);
        const allowedYears = years.map(y => y.year_prefix);

        const [topics] = await db.promise().query('SELECT * FROM survey_topics WHERE survey_id = ? ORDER BY order_index', [id]);

        let fullTopics = [];
        if (topics.length > 0) {
            const topicIds = topics.map(t => t.id);
            const [questions] = await db.promise().query('SELECT * FROM survey_questions WHERE topic_id IN (?) ORDER BY order_index', [topicIds]);
            fullTopics = topics.map(topic => ({
                id: topic.id,           
                title: topic.topic_name,
                subTopics: questions
                    .filter(q => q.topic_id === topic.id)
                    .map(q => ({ 
                        id: q.id,              
                        title: q.question_text,
                        order_index: q.order_index
                    }))
            }));
        }

        res.json({
            ...survey,
            isActive: survey.is_active, 
            startAt: survey.start_at,
            endAt: survey.end_at,
            allowedYears: allowedYears, 
            mainTopics: fullTopics
        });

    } catch (error) {
        console.error("Get Detail Error:", error);
        res.status(500).json({ message: "Error fetching details" });
    }
});

// ==========================================
// 6.3  เปลี่ยนสถานะ เปิด/ปิด 
// ==========================================
app.patch('/api/surveys/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        await db.promise().query(
            'UPDATE surveys SET is_active = ? WHERE id = ?',
            [isActive, id]
        );

        res.json({ success: true, message: "อัปเดตสถานะเรียบร้อย" });
    } catch (error) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดต" });
    }
});

// ==========================================
// 6.4 อัปเดตแบบสอบถาม 
// ==========================================
app.put('/api/surveys/:id', async (req, res) => {
    let connection;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        const { id } = req.params;
        const { title, academicYear, isActive, startAt, endAt, allowedYears, mainTopics } = req.body;
        await connection.query(
            `UPDATE surveys SET title=?, academic_year=?, is_active=?, start_at=?, end_at=? WHERE id=?`,
            [title, academicYear, isActive, startAt, endAt, id]
        );

        await connection.query('DELETE FROM survey_student_years WHERE survey_id = ?', [id]);
        if (allowedYears && allowedYears.length > 0) {
            const yearValues = allowedYears.map(year => [id, year]);
            await connection.query(
                `INSERT INTO survey_student_years (survey_id, year_prefix) VALUES ?`,
                [yearValues]
            );
        }

        await connection.query('DELETE FROM survey_questions WHERE topic_id IN (SELECT id FROM survey_topics WHERE survey_id = ?)', [id]);
        await connection.query('DELETE FROM survey_topics WHERE survey_id = ?', [id]);

        if (mainTopics && mainTopics.length > 0) {
            for (let i = 0; i < mainTopics.length; i++) {
                const topic = mainTopics[i];
                const [topicRes] = await connection.query(
                    `INSERT INTO survey_topics (survey_id, topic_name, order_index) VALUES (?, ?, ?)`,
                    [id, topic.title, i + 1]
                );
                const topicId = topicRes.insertId;

                if (topic.subTopics && topic.subTopics.length > 0) {
                    const questionValues = topic.subTopics.map((sub, idx) => [topicId, sub.title, idx + 1]);
                    await connection.query(`INSERT INTO survey_questions (topic_id, question_text, order_index) VALUES ?`, [questionValues]);
                }
            }
        }

        await connection.commit();
        res.json({ success: true, message: "แก้ไขข้อมูลเรียบร้อย" });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ message: "Update failed" });
    } finally {
        if (connection) connection.release();
    }
});

// ==========================================
// 6.5 ลบแบบสอบถาม (DELETE)
// ==========================================
app.delete('/api/surveys/:id', async (req, res) => {
    let connection;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        const { id } = req.params;
        await connection.query('DELETE FROM survey_questions WHERE topic_id IN (SELECT id FROM survey_topics WHERE survey_id = ?)', [id]);
        await connection.query('DELETE FROM survey_topics WHERE survey_id = ?', [id]);
        await connection.query('DELETE FROM survey_student_years WHERE survey_id = ?', [id]);
        await connection.query('DELETE FROM surveys WHERE id = ?', [id]);

        await connection.commit();
        res.json({ success: true, message: "ลบข้อมูลเรียบร้อย" });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบ" });
    } finally {
        if (connection) connection.release();
    }
});

// ==========================================
// 6.6 API ตรวจสอบการตอบซ้ำ 
// ==========================================
app.get('/api/surveys/:surveyId/check-submit/:username', async (req, res) => {
    try {
        const { surveyId, username } = req.params;
        const [rows] = await db.promise().query(
            `SELECT id FROM survey_responses 
             WHERE survey_id = ? AND username = ? AND respondent_type = 'student'`,
            [surveyId, username]
        );

        res.json({ submitted: rows.length > 0 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error checking submission" });
    }
});
// ==========================================
// 6.7 บันทึกคำตอบแบบสอบถาม (Student) 
// ==========================================
app.post('/api/responses/student', async (req, res) => {
    let connection;
    try {
        const { surveyId, studentCode, answers } = req.body; 
        if (!studentCode) {
            return res.status(400).json({ message: "ไม่พบข้อมูลรหัสนักศึกษา (Student Code Missing)" });
        }

        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        const [existing] = await connection.query(
            "SELECT id FROM survey_responses WHERE survey_id = ? AND username = ?",
            [surveyId, studentCode]
        );

        if (existing.length > 0) {
            throw new Error("คุณได้ทำแบบสอบถามนี้ไปแล้ว ไม่สามารถทำซ้ำได้");
        }

        const [responseRes] = await connection.query(
            `INSERT INTO survey_responses (survey_id, respondent_type, username, submitted_at) 
             VALUES (?, 'student', ?, NOW())`,
            [surveyId, studentCode]
        );

        const responseId = responseRes.insertId;
        if (answers && answers.length > 0) {
            const detailValues = answers.map(ans => [
                responseId,
                ans.question_id,
                ans.score
            ]);

            await connection.query(
                `INSERT INTO response_details (response_id, question_id, score) VALUES ?`,
                [detailValues]
            );
        }

        await connection.commit();
        res.json({ success: true, message: "บันทึกคำตอบสำเร็จ" });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Student Submit Error:", error);
        res.status(400).json({ message: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// ==========================================
// 6.8 บันทึกคำตอบบุคคลทั่วไป (General) 
// ==========================================
app.post('/api/responses/general', async (req, res) => {
    let connection;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        const { surveyId, respondent, suggestion, answers } = req.body;
        const orgType = respondent?.orgType || null;
        const company = respondent?.company || null;
        const email = respondent?.email || null;
  
        const [responseRes] = await connection.query(
            `INSERT INTO survey_responses 
            (survey_id, respondent_type, general_org_type, general_company, general_email, suggestion, submitted_at) 
             VALUES (?, 'general', ?, ?, ?, ?, NOW())`,
            [surveyId, orgType, company, email, suggestion]
        );

        const responseId = responseRes.insertId;
        if (answers && answers.length > 0) {
            const detailValues = answers.map(ans => [
                responseId,
                ans.question_id, 
                ans.score
            ]);

            await connection.query(
                `INSERT INTO response_details (response_id, question_id, score) VALUES ?`,
                [detailValues]
            );
        }

        await connection.commit();
        res.json({ success: true, message: "บันทึกข้อมูลสำเร็จ" });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("General Submit Error:", error); 
        res.status(500).json({ message: "เกิดข้อผิดพลาด: " + error.message });
    } finally {
        if (connection) connection.release();
    }
});

// ==========================================
// 6.9  ดึงข้อมูลการตอบกลับ - สำหรับ Admin/Teacher 
// ==========================================
app.get('/api/surveys/:surveyId/responses', async (req, res) => {
    try {
        const { surveyId } = req.params;
        const [responses] = await db.promise().query(`
            SELECT 
                sr.id,
                sr.respondent_type,
                sr.submitted_at,
                sr.username,      
                sr.general_org_type, 
                sr.general_company, 
                sr.general_email,
                sr.suggestion,
                su.firstname,
                su.lastname,
                CASE 
                    WHEN sr.respondent_type = 'student' THEN CONCAT(su.firstname, ' ', su.lastname)
                    ELSE sr.general_company 
                END AS displayName
            FROM survey_responses sr
            LEFT JOIN student_users su ON sr.username = su.username  
            WHERE sr.survey_id = ?
            ORDER BY sr.submitted_at DESC
        `, [surveyId]);
        
        if (responses.length === 0) {
            return res.json([]);
        }

        const [details] = await db.promise().query(`
            SELECT 
                rd.response_id,
                rd.score,
                sq.question_text
            FROM response_details rd
            JOIN survey_questions sq ON rd.question_id = sq.id
            WHERE rd.response_id IN (
                SELECT id FROM survey_responses WHERE survey_id = ?
            )
        `, [surveyId]);

        const results = responses.map(resItem => {
            const myAnswers = details.filter(d => d.response_id === resItem.id);
            
            return {
                id: resItem.id,
                respondent_type: resItem.respondent_type, 
                general_org_type: resItem.general_org_type, 
                general_company: resItem.general_company, 
                suggestion: resItem.suggestion,
                userName: resItem.displayName || resItem.username || 'บุคคลทั่วไป (ไม่ได้ระบุ)', 
                student_id: resItem.username,
                submitted_at: resItem.submitted_at,
                answers: myAnswers.map(ans => ({
                    question: ans.question_text,
                    answer: ans.score
                }))
            };
        });

        res.json(results);

    } catch (error) {
        console.error("Error fetching responses:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลตอบกลับ" });
    }
});

// ==========================================
// 7.สำหรับจัดการข้อมูลนักศึกษา
// ==========================================

// ==========================================
// 7.1 ดึงข้อมูลนักศึกษา 
// ==========================================
app.get('/api/students', (req, res) => {
    const sql = `
        SELECT 
            s.student_id,
            COALESCE(s.prefix_th, '') AS prefix_th,
            COALESCE(s.first_name_th, su.firstname) AS first_name_th,
            COALESCE(s.last_name_th, su.lastname) AS last_name_th,
            s.status
        FROM students s
        LEFT JOIN student_users su ON (
            s.student_id = su.username OR 
            s.student_id = REPLACE(su.username, 's', '')
        )
        ORDER BY s.student_id ASC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching students:", err);
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
        }
        res.json(results); 
    });
});
// ==========================================
// 7.2 ลบข้อมูลนักศึกษา
// ==========================================
app.delete('/api/students/:id', (req, res) => {
    const studentId = req.params.id;
    db.query("DELETE FROM students WHERE student_id = ?", [studentId], (err, results) => {
        if (err) {
            console.error("Error deleting student:", err);
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
        }
        res.json({ message: "ลบข้อมูลสำเร็จ" });
    });
});
// 7.2.1 ลบข้อมูลนักศึกษาแบบกลุ่ม 
app.post('/api/students/bulk-delete', (req, res) => {
    const { studentIds } = req.body; 
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ message: "กรุณาเลือกรายการที่ต้องการลบ" });
    }

    db.query("DELETE FROM students WHERE student_id IN (?)", [studentIds], (err, results) => {
        if (err) {
            console.error("Error bulk deleting students:", err);
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูลกลุ่ม" });
        }
        res.json({ message: `ลบข้อมูลสำเร็จ ${results.affectedRows} รายการ` });
    });
});
// ==========================================
//  7.3 ปรับปรุงการนำเข้าไฟล์ Excel (ป้องกันชื่อหาย)
// ==========================================
app.post('/api/students/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'กรุณาอัปโหลดไฟล์' });
    try {
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { range: 6 });

        const values = data.map(row => {
            const studentId = String(row['เลขประจำตัว'] || row['Student ID'] || '').trim();
            const prefix = String(row['คำนำหน้าชื่อ'] || row['Prefix'] || '').trim();
            const fname = String(row['ชื่อ'] || row['First Name'] || '').trim();
            const lname = String(row['นามสกุล'] || row['Last Name'] || '').trim();
            const remark = String(row['หมายเหตุ'] || '').trim();
            
            const status = remark.includes('สำเร็จการศึกษา') ? 'graduated' : 'active';

            return [studentId, prefix, fname, lname, status];
        }).filter(row => row[0] && (row[2] || row[3])); 

        if (values.length === 0) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: "ไม่พบข้อมูลชื่อ-นามสกุลในไฟล์ Excel กรุณาตรวจสอบหัวตาราง" });
        }

        const query = `
            INSERT INTO students (student_id, prefix_th, first_name_th, last_name_th, status) 
            VALUES ? 
            ON DUPLICATE KEY UPDATE 
                prefix_th=VALUES(prefix_th), 
                first_name_th=VALUES(first_name_th), 
                last_name_th=VALUES(last_name_th), 
                status=VALUES(status)
        `;

        db.query(query, [values], (err, result) => {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); 
            if (err) {
                console.error("DB Error:", err);
                return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกฐานข้อมูล' });
            }
            res.json({ message: `นำเข้า/อัปเดตสำเร็จ ${result.affectedRows} รายการ` });
        });
    } catch (error) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
});
// ==========================================
// 7.4 เพิ่มข้อมูลนักศึกษารายบุคคล (แบบกรอกฟอร์ม)
// ==========================================
app.post('/api/students', (req, res) => {
    const { student_id, prefix_th, first_name_th, last_name_th, status } = req.body;
    if (!student_id || !first_name_th || !last_name_th) {
        return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน (รหัส, ชื่อ, นามสกุล)" });
    }

    const query = `
        INSERT INTO students (student_id, prefix_th, first_name_th, last_name_th, status) 
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            prefix_th = VALUES(prefix_th), 
            first_name_th = VALUES(first_name_th), 
            last_name_th = VALUES(last_name_th), 
            status = VALUES(status)
    `;

    db.query(query, [student_id, prefix_th, first_name_th, last_name_th, status || 'active'], (err, result) => {
        if (err) {
            console.error("Insert Error:", err);
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
        }
        res.json({ message: "บันทึกข้อมูลนักศึกษาสำเร็จ" });
    });
});


// ==========================================
// 8. สำหรับจัดการข้อมูลการฝึกงานนักศึกษา
// ==========================================

// ==========================================
// 8.1 ดึงข้อมูลนักศึกษาทั้งหมดไปแสดงใน Dropdown 
// ==========================================
app.get('/api/students/dropdown', (req, res) => {
    const sql = `
        SELECT 
            s.student_id, 
            s.prefix_th, 
            COALESCE(s.first_name_th, su.firstname) AS first_name_th, 
            COALESCE(s.last_name_th, su.lastname) AS last_name_th
        FROM students s
        LEFT JOIN student_users su ON (
            s.student_id = su.username OR 
            s.student_id = REPLACE(su.username, 's', '')
        )
        ORDER BY s.student_id ASC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลนักศึกษา" });
        }
        res.json(results);
    });
});

// ==========================================
// 8.2 บันทึกข้อมูลการฝึกงาน 
// ==========================================
app.post('/api/internships', upload.array('files', 10), (req, res) => {
    const { studentId, prefix_th, first_name_th, last_name_th, type, placeName, country, city, institution, startDate, endDate } = req.body;
    let fileName = null;
    let filePath = null;

    if (req.files && req.files.length > 0) {
        const fileNames = req.files.map(file => Buffer.from(file.originalname, 'latin1').toString('utf8'));
        const filePaths = req.files.map(file => file.filename);
        fileName = fileNames.join(','); 
        filePath = filePaths.join(','); 
    }

    const cleanStudentId = studentId ? studentId.replace(/^s/i, '') : null;

    if (!cleanStudentId) {
        return res.status(400).json({ message: "ไม่พบรหัสนักศึกษา" });
    }

    const insertInternship = () => {
        const query = `
            INSERT INTO internships 
            (student_id, prefix_th, first_name_th, last_name_th, internship_type, place_name, country, city, institution, start_date, end_date, file_name, file_path, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `;

        const values = [
            cleanStudentId, 
            prefix_th || null,      
            first_name_th || null,   
            last_name_th || null,    
            type, placeName || null, country || null, city || null, institution || null, 
            startDate || null, endDate || null, fileName, filePath
        ];

        db.query(query, values, (err, result) => {
            if (err) {
                console.error("Error inserting internship:", err);
                return res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูลการฝึกงาน" });
            }
            res.status(200).json({ message: "บันทึกข้อมูลสำเร็จ!" });
        });
    };

    db.query("SELECT student_id FROM students WHERE student_id = ?", [cleanStudentId], (err, results) => {
        if (err) return res.status(500).json({ message: "Error checking student" });
        if (results.length === 0) {
            db.query("INSERT INTO students (student_id, status) VALUES (?, 'active')", [cleanStudentId], (insertErr) => {
                if (insertErr) return res.status(500).json({ message: "Error auto-inserting student profile" });
                insertInternship();
            });
        } else {
            insertInternship();
        }
    });
});

// ==========================================
// 8.3 ดึงข้อมูลการฝึกงานทั้งหมด 
// ==========================================
app.get('/api/internships', (req, res) => {
    const sql = `
        SELECT 
            i.id AS internship_id,
            i.student_id, 
            COALESCE(i.first_name_th, s.first_name_th, su.firstname) AS first_name_th, 
            COALESCE(i.last_name_th, s.last_name_th, su.lastname) AS last_name_th, 
            s.prefix_th,
            i.internship_type, 
            i.place_name,
            i.start_date,  
            i.end_date,   
            i.file_name, 
            i.file_path,
            i.status,              
            i.reject_comment       
        FROM internships i
        LEFT JOIN students s ON i.student_id = s.student_id
        LEFT JOIN student_users su ON (
            i.student_id = su.username OR 
            i.student_id = REPLACE(su.username, 's', '')
        )
        ORDER BY i.id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error:", err);
            return res.status(500).json({ message: "Error fetching data" });
        }
        res.json(results);
    });
});

// ==========================================
// 8.4 ลบข้อมูลการฝึกงาน 
// ==========================================
app.delete('/api/internships/:id', (req, res) => {
    const internshipId = req.params.id; 
    db.query("SELECT file_path FROM internships WHERE id = ?", [internshipId], (err, results) => {
        if (err) {
            console.error("Error fetching internship for deletion:", err);
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในการตรวจสอบไฟล์" });
        }
        if (results.length > 0 && results[0].file_path) {
            const filesToDelete = results[0].file_path.split(','); 
            filesToDelete.forEach(fileName => {
                const filePath = path.join(__dirname, 'uploads/internships', fileName);
                
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath); 
                    } catch (unlinkErr) {
                        console.error(`ไม่สามารถลบไฟล์ได้: ${filePath}`, unlinkErr);
                    }
                }
            });
        }

        db.query("DELETE FROM internships WHERE id = ?", [internshipId], (deleteErr, deleteResults) => {
            if (deleteErr) {
                console.error("Error deleting internship:", deleteErr);
                return res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
            }
            res.json({ message: "ลบข้อมูลและไฟล์แนบสำเร็จ" });
        });
    });
});

// ==========================================
// 8.5 ดึงข้อมูลการฝึกงาน 1 รายการตาม ID สำหรับดึงมาแสดงในฟอร์มแก้ไข
// ==========================================
app.get('/api/internships/:id', (req, res) => {
    const internshipId = req.params.id;
    const query = "SELECT * FROM internships WHERE id = ?";
    
    db.query(query, [internshipId], (err, results) => {
        if (err) {
            console.error("Error fetching internship by ID:", err);
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลการฝึกงานนี้" });
        }
        res.json(results[0]); 
    });
});

// ==========================================
// 8.6 อัปเดตข้อมูลการฝึกงาน 
// ==========================================
app.put('/api/internships/:id', upload.array('files', 10), (req, res) => {
    const internshipId = req.params.id;
    const { studentId, prefix_th, first_name_th, last_name_th, type, placeName, country, city, institution, startDate, endDate } = req.body;
    const cleanStudentId = studentId ? studentId.replace(/^s/i, '') : null;
    const executeUpdate = (query, values) => {
        db.query(query, values, (err, result) => {
            if (err) {
                console.error("Error updating internship:", err);
                return res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" });
            }
            res.status(200).json({ message: "อัปเดตข้อมูลสำเร็จ!" });
        });
    };

    if (req.files && req.files.length > 0) {
        db.query("SELECT file_path FROM internships WHERE id = ?", [internshipId], (err, results) => {
            if (!err && results.length > 0 && results[0].file_path) {
                const oldFiles = results[0].file_path.split(',');
                oldFiles.forEach(fileName => {
                    const oldFilePath = path.join(__dirname, 'uploads/internships', fileName);
                    if (fs.existsSync(oldFilePath)) {
                        try {
                            fs.unlinkSync(oldFilePath);
                        } catch (unlinkErr) {
                            console.error(`ไม่สามารถลบไฟล์เก่าได้: ${oldFilePath}`, unlinkErr);
                        }
                    }
                });
            }
            const fileName = req.files.map(file => Buffer.from(file.originalname, 'latin1').toString('utf8')).join(',');
            const filePath = req.files.map(file => file.filename).join(',');
            
            const query = `UPDATE internships SET student_id = ?, prefix_th = ?, first_name_th = ?, last_name_th = ?, internship_type = ?, place_name = ?, country = ?, city = ?, institution = ?, start_date = ?, end_date = ?, file_name = ?, file_path = ?, status = 'pending', reject_comment = NULL WHERE id = ?`;
            const values = [cleanStudentId, prefix_th || null, first_name_th || null, last_name_th || null, type, placeName || null, country || null, city || null, institution || null, startDate || null, endDate || null, fileName, filePath, internshipId];
            
            executeUpdate(query, values);
        });

    } else {
        const query = `UPDATE internships SET student_id = ?, prefix_th = ?, first_name_th = ?, last_name_th = ?, internship_type = ?, place_name = ?, country = ?, city = ?, institution = ?, start_date = ?, end_date = ?, status = 'pending', reject_comment = NULL WHERE id = ?`;
        const values = [cleanStudentId, prefix_th || null, first_name_th || null, last_name_th || null, type, placeName || null, country || null, city || null, institution || null, startDate || null, endDate || null, internshipId];
        
        executeUpdate(query, values);
    }
});

// ==========================================
// 8.7 อนุมัติการฝึกงาน
// ==========================================
app.put('/api/internships/approve/:id', (req, res) => {
    const internshipId = req.params.id;
    const query = `UPDATE internships SET status = 'approved', reject_comment = NULL WHERE id = ?`;

    db.query(query, [internshipId], (err, result) => {
        if (err) {
            console.error("Error approving:", err);
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในการอนุมัติ" });
        }
        res.status(200).json({ message: "อนุมัติการฝึกงานสำเร็จ!" });
    });
});

// ==========================================
// 8.8 ปฏิเสธ/ตีกลับให้แก้ไข
// ==========================================
app.put('/api/internships/reject/:id', express.json(), (req, res) => {
    const internshipId = req.params.id;
    const { comment } = req.body; 

    const query = `UPDATE internships SET status = 'rejected', reject_comment = ? WHERE id = ?`;

    db.query(query, [comment, internshipId], (err, result) => {
        if (err) {
            console.error("Error rejecting:", err);
            return res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
        }
        res.status(200).json({ message: "ส่งให้กลับไปแก้ไขสำเร็จ!" });
    });
});

// ==========================================
// 9.ผลงานอาจารย์
// ==========================================
// ==========================================
// 9.1 ดึงรายชื่ออาจารย์ 
// ==========================================
app.get('/api/teachers', (req, res) => {
    const sql = `SELECT id, teacher_code, prefix_th, first_name_th, last_name_th FROM teachers WHERE status = 'active'`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});
// ==========================================
// 9.2 สำหรับดึงรหัส ID 
// ==========================================
app.get('/api/teacher-works/next-id/:teacherCode', (req, res) => {
    const teacherCode = req.params.teacherCode;
    const prefix = `W${teacherCode}`; 
    const sql = `SELECT work_code FROM teacher_works WHERE work_code LIKE ? ORDER BY id DESC LIMIT 1`;
    
    db.query(sql, [`${prefix}%`], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        let nextNum = 1; 
        
        if (results.length > 0) {
            const lastCode = results[0].work_code; 
            const lastNumStr = lastCode.replace(prefix, ''); 
            const lastNum = parseInt(lastNumStr, 10);
            
            if (!isNaN(lastNum)) {
                nextNum = lastNum + 1; 
            }
        }
        res.json({ nextId: `${prefix}${nextNum}` }); 
    });
});
// ==========================================
// 9.3 บันทึกผลงานอาจารย์และอัปโหลดหลายไฟล์
// ==========================================

app.post('/api/teacher-works', upload.array('files', 10), (req, res) => {
    const { workCode, teacherId, academicYear, workName, organization, location, date, description } = req.body;
    const sqlWork = `
        INSERT INTO teacher_works 
        (work_code, teacher_id, academic_year, work_name, organization, location, work_date, description) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const valuesWork = [workCode, teacherId, academicYear, workName, organization, location, date, description];

    db.query(sqlWork, valuesWork, (err, result) => {
        if (err) return res.status(500).json({ error: "บันทึกข้อมูลหลักไม่สำเร็จ", details: err.message });

        const newWorkId = result.insertId;
        if (req.files && req.files.length > 0) {
            const sqlFiles = `INSERT INTO teacher_work_files (work_id, file_name, original_file_name) VALUES ?`;
            const filesData = req.files.map(file => {
                const originalFileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
                return [newWorkId, file.filename, originalFileName];
            });

            db.query(sqlFiles, [filesData], (errFile) => {
                if (errFile) return res.status(500).json({ error: "อัปโหลดไฟล์ไม่สำเร็จ", details: errFile.message });
                return res.status(201).json({ message: "บันทึกข้อมูลและไฟล์ทั้งหมดสำเร็จ" });
            });
        } else {
            res.status(201).json({ message: "บันทึกข้อมูลสำเร็จ (ไม่มีไฟล์แนบ)" });
        }
    });
});

// ==========================================
// 10.ผลงานเจ้าหน้าที่ (Staff Works)
// ==========================================

// ==========================================
// 10.1 ดึงรายชื่อเจ้าหน้าที่ทั้งหมดที่ยังทำงานอยู่
// ==========================================
app.get('/api/staffs', (req, res) => {
    const sql = `SELECT id, staff_code, prefix_th, first_name_th, last_name_th FROM staffs WHERE status = 'active'`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});
// ==========================================
// 10.2 ดึงรหัส ID 
// ==========================================
app.get('/api/staff-works/next-id/:staffCode', (req, res) => {
    const staffCode = req.params.staffCode;
    const prefix = `W${staffCode}`; 
    
    const sql = `SELECT work_code FROM staff_works WHERE work_code LIKE ? ORDER BY id DESC LIMIT 1`;
    
    db.query(sql, [`${prefix}%`], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        let nextNum = 1; 
        if (results.length > 0) {
            const lastCode = results[0].work_code;
            const lastNumStr = lastCode.replace(prefix, '');
            const lastNum = parseInt(lastNumStr, 10);
            if (!isNaN(lastNum)) {
                nextNum = lastNum + 1;
            }
        }
        res.json({ nextId: `${prefix}${nextNum}` });
    });
});
// ==========================================
// 10.3 บันทึกผลงานเจ้าหน้าที่และอัปโหลดหลายไฟล์
// ==========================================
app.post('/api/staff-works', upload.array('files', 10), (req, res) => {
    const { workCode, staffId, academicYear, workName, organization, location, date, description } = req.body;
    
    const sqlWork = `
        INSERT INTO staff_works 
        (work_code, staff_id, academic_year, work_name, organization, location, work_date, description) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const valuesWork = [workCode, staffId, academicYear, workName, organization, location, date, description];

    db.query(sqlWork, valuesWork, (err, result) => {
        if (err) return res.status(500).json({ error: "บันทึกข้อมูลหลักไม่สำเร็จ", details: err.message });

        const newWorkId = result.insertId;

        if (req.files && req.files.length > 0) {
            const sqlFiles = `INSERT INTO staff_work_files (work_id, file_name, original_file_name) VALUES ?`;
            const filesData = req.files.map(file => {
                const originalFileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
                return [newWorkId, file.filename, originalFileName];
            });

            db.query(sqlFiles, [filesData], (errFile) => {
                if (errFile) return res.status(500).json({ error: "อัปโหลดไฟล์ไม่สำเร็จ", details: errFile.message });
                return res.status(201).json({ message: "บันทึกข้อมูลและไฟล์ทั้งหมดสำเร็จ" });
            });
        } else {
            res.status(201).json({ message: "บันทึกข้อมูลสำเร็จ (ไม่มีไฟล์แนบ)" });
        }
    });
});

// ==========================================
// 11.ผลงานนักศึกษา 
// ==========================================
// ==========================================
// 11.1 ดึงรายชื่อนักศึกษา
// ==========================================
app.get('/api/students', (req, res) => {
    const sql = `SELECT student_id, prefix_th, first_name_th, last_name_th FROM students WHERE status = 'active'`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});
// ==========================================
// 11.2 ดึงรหัส ID ถัดไป 
// ==========================================
app.get('/api/student-works/next-id/:studentId', (req, res) => {
    const studentId = req.params.studentId;
    const prefix = `W${studentId}`; 
    
    const sql = `SELECT work_code FROM student_works WHERE work_code LIKE ? ORDER BY id DESC LIMIT 1`;
    
    db.query(sql, [`${prefix}%`], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        let nextNum = 1; 
        if (results.length > 0) {
            const lastCode = results[0].work_code;
            const lastNumStr = lastCode.replace(prefix, '');
            const lastNum = parseInt(lastNumStr, 10);
            if (!isNaN(lastNum)) {
                nextNum = lastNum + 1;
            }
        }
        res.json({ nextId: `${prefix}${nextNum}` });
    });
});
// ==========================================
// 11.3 บันทึกผลงานนักศึกษาและอัปโหลดหลายไฟล์
// ==========================================
app.post('/api/student-works', upload.array('files', 10), (req, res) => {
    const { workCode, studentId, academicYear, workName, organization, location, date, description } = req.body;
    
    const sqlWork = `
        INSERT INTO student_works 
        (work_code, student_id, academic_year, work_name, organization, location, work_date, description) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const valuesWork = [workCode, studentId, academicYear, workName, organization, location, date, description];

    db.query(sqlWork, valuesWork, (err, result) => {
        if (err) return res.status(500).json({ error: "บันทึกข้อมูลหลักไม่สำเร็จ", details: err.message });

        const newWorkId = result.insertId;

        if (req.files && req.files.length > 0) {
            const sqlFiles = `INSERT INTO student_work_files (work_id, file_name, original_file_name) VALUES ?`;
            const filesData = req.files.map(file => {
                const originalFileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
                return [newWorkId, file.filename, originalFileName];
            });

            db.query(sqlFiles, [filesData], (errFile) => {
                if (errFile) return res.status(500).json({ error: "อัปโหลดไฟล์ไม่สำเร็จ", details: errFile.message });
                return res.status(201).json({ message: "บันทึกข้อมูลและไฟล์ทั้งหมดสำเร็จ" });
            });
        } else {
            res.status(201).json({ message: "บันทึกข้อมูลสำเร็จ (ไม่มีไฟล์แนบ)" });
        }
    });
});

// ==========================================
// 12.สำหรับหน้ารายการผลงานรวม 
// ==========================================
// ==========================================
// 12.1 ดึงรายชื่อ "อาจารย์" ที่มีผลงาน
// ==========================================
app.get('/api/work-summary/teachers', (req, res) => {
    const sql = `
        SELECT DISTINCT t.id, t.teacher_code as code, t.short_name, t.prefix_th, t.first_name_th, t.last_name_th, t.photo 
        FROM teachers t 
        JOIN teacher_works w ON t.id = w.teacher_id
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});
// ==========================================
// 12.2 ดึงรายชื่อ "เจ้าหน้าที่" ที่มีผลงาน
// ==========================================
app.get('/api/work-summary/staffs', (req, res) => {
    const sql = `
        SELECT DISTINCT s.id, s.staff_code as code, s.prefix_th, s.first_name_th, s.last_name_th, s.photo 
        FROM staffs s 
        JOIN staff_works w ON s.id = w.staff_id
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});
// ==========================================
// 12.3 ดึงรายชื่อ "นักศึกษา" ที่มีผลงาน
// ==========================================
app.get('/api/work-summary/students', (req, res) => {
    const sql = `
        SELECT DISTINCT s.student_id as id, s.student_id as code, s.prefix_th, s.first_name_th, s.last_name_th 
        FROM students s 
        JOIN student_works w ON s.student_id = w.student_id
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ==========================================
// 13.จัดการผลงานรายบุคคล 
// ==========================================

// ==========================================
// 13.1 ดึงรายการผลงานทั้งหมดของ User 1 คน 
// ==========================================
app.get('/api/works/:type/:userId', (req, res) => {
    const { type, userId } = req.params;
    let sql = '';
    const selectFields = `id, work_code, academic_year, work_name, organization, location`;

    if (type === 'teacher') {
        sql = `SELECT ${selectFields} FROM teacher_works WHERE teacher_id = ? ORDER BY id DESC`;
    } else if (type === 'staff') {
        sql = `SELECT ${selectFields} FROM staff_works WHERE staff_id = ? ORDER BY id DESC`;
    } else if (type === 'student') {
        sql = `SELECT ${selectFields} FROM student_works WHERE student_id = ? ORDER BY id DESC`;
    } else {
        return res.status(400).json({ error: "Invalid user type" });
    }

    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});
// ==========================================
// 13.2 ดึงรายละเอียดผลงาน 1 ชิ้น 
// ==========================================
app.get('/api/work-details/:type/:workId', (req, res) => {
    const { type, workId } = req.params;
    let sqlWork = '';
    let sqlFiles = '';

    const detailFields = `w.id, w.work_code AS workCode, w.academic_year AS academicYear, w.work_name AS workName, 
                          w.organization, w.location, w.work_date AS workDate, w.description`;

    if (type === 'teacher') {
        sqlWork = `SELECT ${detailFields}, CONCAT(IFNULL(t.prefix_th,''), t.first_name_th, ' ', t.last_name_th) AS ownerName 
                   FROM teacher_works w JOIN teachers t ON w.teacher_id = t.id WHERE w.id = ?`;
        sqlFiles = `SELECT id, file_name, original_file_name FROM teacher_work_files WHERE work_id = ?`;
    } else if (type === 'staff') {
        sqlWork = `SELECT ${detailFields}, CONCAT(IFNULL(s.prefix_th,''), s.first_name_th, ' ', s.last_name_th) AS ownerName 
                   FROM staff_works w JOIN staffs s ON w.staff_id = s.id WHERE w.id = ?`;
        sqlFiles = `SELECT id, file_name, original_file_name FROM staff_work_files WHERE work_id = ?`;
    } else if (type === 'student') {
        sqlWork = `SELECT ${detailFields}, CONCAT(IFNULL(s.prefix_th,''), s.first_name_th, ' ', s.last_name_th) AS ownerName 
                   FROM student_works w JOIN students s ON w.student_id = s.student_id WHERE w.id = ?`;
        sqlFiles = `SELECT id, file_name, original_file_name FROM student_work_files WHERE work_id = ?`;
    }

    db.query(sqlWork, [workId], (err, workResults) => {
        if (err) return res.status(500).json({ error: err.message });
        if (workResults.length === 0) return res.status(404).json({ message: "ไม่พบข้อมูลผลงาน" });

        const workData = workResults[0];
        db.query(sqlFiles, [workId], (errFile, fileResults) => {
            if (errFile) return res.status(500).json({ error: errFile.message });
            res.json({ ...workData, files: fileResults });
        });
    });
});
// ==========================================
// 13.3 ลบผลงาน
// ==========================================
app.delete('/api/works/:type/:workId', (req, res) => {
    const { type, workId } = req.params;
    let sql = '';

    if (type === 'teacher') sql = 'DELETE FROM teacher_works WHERE id = ?';
    else if (type === 'staff') sql = 'DELETE FROM staff_works WHERE id = ?';
    else if (type === 'student') sql = 'DELETE FROM student_works WHERE id = ?';

    db.query(sql, [workId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "ลบผลงานสำเร็จ" });
    });
});
// ==========================================
// 13.4 ข้อมูลผลงาน 
// ==========================================
app.put('/api/works/:type/:workId', upload.array('files', 10), (req, res) => {
    const { type, workId } = req.params;
    const { academicYear, workName, organization, location, date, description } = req.body;

    let sqlWork = '';
    if (type === 'teacher') sqlWork = 'UPDATE teacher_works SET academic_year=?, work_name=?, organization=?, location=?, work_date=?, description=? WHERE id=?';
    else if (type === 'staff') sqlWork = 'UPDATE staff_works SET academic_year=?, work_name=?, organization=?, location=?, work_date=?, description=? WHERE id=?';
    else if (type === 'student') sqlWork = 'UPDATE student_works SET academic_year=?, work_name=?, organization=?, location=?, work_date=?, description=? WHERE id=?';
    else return res.status(400).json({ error: "Invalid type" });

    const values = [academicYear, workName, organization, location, date, description, workId];

    db.query(sqlWork, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (req.files && req.files.length > 0) {
            let sqlFiles = '';
            if (type === 'teacher') sqlFiles = 'INSERT INTO teacher_work_files (work_id, file_name, original_file_name) VALUES ?';
            else if (type === 'staff') sqlFiles = 'INSERT INTO staff_work_files (work_id, file_name, original_file_name) VALUES ?';
            else if (type === 'student') sqlFiles = 'INSERT INTO student_work_files (work_id, file_name, original_file_name) VALUES ?';

            const filesData = req.files.map(file => {
                const originalFileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
                return [workId, file.filename, originalFileName];
            });

            db.query(sqlFiles, [filesData], (errFile) => {
                if (errFile) return res.status(500).json({ error: errFile.message });
                return res.json({ message: "อัปเดตข้อมูลและไฟล์สำเร็จ" });
            });
        } else {
            res.json({ message: "อัปเดตข้อมูลสำเร็จ" });
        }
    });
});
// ==========================================
// 13.5 ลบไฟล์แนบรายไฟล์ 
// ==========================================
app.delete('/api/work-files/:type/:fileId', (req, res) => {
    const { type, fileId } = req.params;
    let sql = '';
    
    if (type === 'teacher') sql = 'DELETE FROM teacher_work_files WHERE id=?';
    else if (type === 'staff') sql = 'DELETE FROM staff_work_files WHERE id=?';
    else if (type === 'student') sql = 'DELETE FROM student_work_files WHERE id=?';

    db.query(sql, [fileId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "ลบไฟล์สำเร็จ" });
    });
});


// ==========================================
// ======== Dashdoard ===========
// ==========================================

// ==========================================
// --- ผลงานวิชาการ ---
// ==========================================
app.get('/api/teacher-works-summary', (req, res) => {
  const sql = `
    SELECT 
      t.id AS teacher_id,
      CONCAT(IFNULL(t.prefix_th, ''), t.first_name_th, ' ', t.last_name_th) AS teacher_name,
      COUNT(DISTINCT r.id) AS researches_count,
      COUNT(DISTINCT j.id) AS journals_count,
      COUNT(DISTINCT c.id) AS conferences_count,
      COUNT(DISTINCT b.id) AS books_count,
      (COUNT(DISTINCT r.id) + COUNT(DISTINCT j.id) + COUNT(DISTINCT c.id) + COUNT(DISTINCT b.id)) AS total_works
    FROM teachers t
    LEFT JOIN researches r ON t.id = r.teacher_id
    LEFT JOIN journals j ON t.id = j.teacher_id
    LEFT JOIN conferences c ON t.id = c.teacher_id
    LEFT JOIN books b ON t.id = b.teacher_id
    GROUP BY t.id
    HAVING total_works > 0
    ORDER BY total_works DESC;
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error('Error fetching pie chart data:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// ==========================================
// ---  การอบรมอาจารย์ ---
// ==========================================
app.get('/api/teacher-trainings-summary', (req, res) => {
  const sql = `
    SELECT 
      t.id AS id,
      CONCAT(IFNULL(t.prefix_th, ''), t.first_name_th, ' ', t.last_name_th) AS name,
      -- แปลงค่าเป็นตัวเลขตรงนี้ --
      CAST(SUM(tr.total_hours) AS UNSIGNED) AS total_hours, 
      COUNT(tr.id) AS training_count
    FROM teachers t
    INNER JOIN teacher_trainings tr ON t.id = tr.teacher_id
    GROUP BY t.id
    ORDER BY total_hours DESC;
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error('Error fetching teacher training data:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// ==========================================
// --- การอบรมเจ้าหน้าที่ ---
// ==========================================
app.get('/api/staff-trainings-summary', (req, res) => {
  const sql = `
    SELECT 
      s.id AS id,
      CONCAT(IFNULL(s.prefix_th, ''), s.first_name_th, ' ', s.last_name_th) AS name,
      CAST(SUM(st.total_hours) AS UNSIGNED) AS total_hours,
      COUNT(st.id) AS training_count
    FROM staffs s
    INNER JOIN staff_trainings st ON s.id = st.staff_id
    GROUP BY s.id
    ORDER BY total_hours DESC;
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error('Error fetching staff training data:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// ==========================================
// --- สถิติผลงานอาจารย์ ---
// ==========================================
app.get('/api/teacher-works-count', (req, res) => {
    const sql = `
        SELECT 
            CONCAT(t.prefix_th, t.first_name_th, ' ', t.last_name_th) AS name, 
            COUNT(tw.id) AS total_works 
        FROM teacher_works tw 
        JOIN teachers t ON tw.teacher_id = t.id 
        GROUP BY tw.teacher_id, t.prefix_th, t.first_name_th, t.last_name_th
        HAVING total_works > 0
        ORDER BY total_works DESC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error("SQL Error (Teacher):", err.message);
            return res.status(500).json([]);
        }
        res.json(results);
    });
});
// ==========================================
// --- สถิติผลงานเจ้าหน้าที่ ---
// ==========================================
app.get('/api/staff-works-count', (req, res) => {
    const sql = `
        SELECT 
            CONCAT(s.prefix_th, s.first_name_th, ' ', s.last_name_th) AS name, 
            COUNT(sw.id) AS total_works 
        FROM staff_works sw 
        JOIN staffs s ON sw.staff_id = s.id 
        GROUP BY sw.staff_id, s.prefix_th, s.first_name_th, s.last_name_th
        HAVING total_works > 0
        ORDER BY total_works DESC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error("SQL Error (Staff):", err.message);
            return res.status(500).json([]);
        }
        res.json(results);
    });
});
// ==========================================
// --- สถิติผลงานนักศึกษา ---
// ==========================================
app.get('/api/student-works-count', (req, res) => {
    const sql = `
        SELECT 
            CONCAT(st.prefix_th, st.first_name_th, ' ', st.last_name_th) AS name, 
            COUNT(stw.id) AS total_works 
        FROM student_works stw 
        JOIN students st ON stw.student_id = st.student_id 
        GROUP BY st.student_id, st.prefix_th, st.first_name_th, st.last_name_th
        HAVING total_works > 0
        ORDER BY total_works DESC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error("SQL Error (Student):", err.message);
            return res.status(500).json([]);
        }
        res.json(results);
    });
});
// ==========================================
// --- สถิติแบบสอบถาม 
// ==========================================
app.get('/api/survey-summary', (req, res) => {
    const sql = `
        SELECT 
            s.code,
            s.title AS survey_name,
            CASE 
                WHEN s.target_group = 'student' THEN 'นักศึกษา'
                WHEN s.target_group = 'general' THEN 'บุคคลทั่วไป'
            END AS target_group_th,
            COUNT(DISTINCT r.id) AS respondents,
            IFNULL(ROUND(AVG(NULLIF(rd.score, 0)), 2), 0) AS average_score
        FROM surveys s
        LEFT JOIN survey_responses r ON s.id = r.survey_id
        LEFT JOIN response_details rd ON r.id = rd.response_id
        GROUP BY s.id, s.code, s.title, s.target_group
        ORDER BY s.id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("SQL Error (Survey Summary):", err.message);
            return res.status(500).json([]);
        }
        res.json(results);
    });
});

// ==========================================
//  สำหรับหน้ารายงานวิจัย
// ==========================================
// ==========================================
// ดึงข้อมูลเฉพาะ "งานวิจัย" สำหรับหน้ารายงาน
// ==========================================
app.get('/api/reports/only-researches', async (req, res) => {
    try {
        const sql = `
            SELECT 
                r.id, 
                r.teacher_id, 
                r.research_name AS title, 
                r.research_name_en,
                r.academic_year AS year, 
                r.budget, 
                r.organization, 
                r.location,
                r.volume,
                r.order_no,
                r.publish_date,
                r.edition_year,
                t.prefix_th, 
                t.first_name_th, 
                t.last_name_th,
                (
                    SELECT JSON_ARRAYAGG(JSON_OBJECT('first_name_en', a.first_name_en, 'last_name_en', a.last_name_en))
                    FROM research_authors a 
                    WHERE a.research_id = r.id
                ) AS authors_list
            FROM researches r
            LEFT JOIN teachers t ON r.teacher_id = t.id
            ORDER BY r.academic_year DESC
        `;

        const [results] = await db.promise().query(sql);
        res.status(200).json(results);
    } catch (err) {
        console.error("Error fetching researches for report:", err);
        res.status(500).json({ error: "ดึงข้อมูลงานวิจัยล้มเหลว" });
    }
});
// ==========================================
//  ดึงข้อมูลเฉพาะ "วารสารวิชาการ" สำหรับหน้ารายงาน
// ==========================================
app.get('/api/reports/only-journals', async (req, res) => {
    try {
        const sql = `
            SELECT 
                j.id, 
                j.teacher_id, 
                j.title_name AS title, 
                j.title_name_en,
                j.journal_name,
                j.journal_name_en,
                j.academic_year AS year, 
                j.volume, 
                j.edition_year, 
                j.page_no,
                j.document_link,
                'journal' AS type,
                t.prefix_th, 
                t.first_name_th, 
                t.last_name_th,
                t.prefix_en,
                t.first_name_en, 
                t.last_name_en
            FROM journals j
            LEFT JOIN teachers t ON j.teacher_id = t.id
            ORDER BY j.academic_year DESC, j.created_at DESC
        `;

        const [results] = await db.promise().query(sql);
        res.status(200).json(results);
    } catch (err) {
        console.error("Error fetching journals for report:", err);
        res.status(500).json({ error: "ดึงข้อมูลวารสารล้มเหลว" });
    }
});
// ==========================================
// ดึงข้อมูลประชุมวิชาการ พร้อมรวมชื่อผู้แต่งทุกคน
// ==========================================
app.get('/api/reports/conferences-formatted', async (req, res) => {
    try {
        const sql = `
            SELECT 
                c.id,
                c.teacher_id,
                c.academic_year,
                c.conference_level,
                c.article_title,
                c.article_title_en,
                c.conference_name,
                c.conference_name_en,
                c.location,
                c.edition_year,
                t.prefix_th,
                t.first_name_th,
                t.last_name_th,
                t.first_name_en, 
                t.last_name_en,  
                -- รวมชื่อผู้แต่งทุกคนคั่นด้วยลูกน้ำ
                GROUP_CONCAT(CONCAT(a.first_name_en, ' ', a.last_name_en) SEPARATOR ', ') AS authors_en
            FROM conferences c
            LEFT JOIN conference_authors a ON c.id = a.conference_id
            LEFT JOIN teachers t ON c.teacher_id = t.id
            GROUP BY c.id
            ORDER BY c.academic_year DESC, c.conference_level ASC;
        `;

        const [results] = await db.promise().query(sql);
        res.status(200).json(results);
    } catch (err) {
        console.error("Error fetching formatted conferences:", err);
        res.status(500).json({ error: "ดึงข้อมูลล้มเหลว" });
    }
});

// ==========================================
//  สำหรับหน้ารายงานการอบรมสัมมนา
// ==========================================

// ==========================================
// สำหรับดึงรายชื่ออาจารย์ 
// ==========================================
app.get('/api/teachers', async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT id, prefix_th, first_name_th, last_name_th 
      FROM teachers 
      WHERE status = 'active'
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ error: 'ดึงข้อมูลอาจารย์ล้มเหลว' });
  }
});

// ==========================================
// สำหรับดึงรายชื่อเจ้าหน้าที่ 
// ==========================================
app.get('/api/staffs', async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT id, prefix_th, first_name_th, last_name_th 
      FROM staffs 
      WHERE status = 'active'
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching staffs:', error);
    res.status(500).json({ error: 'ดึงข้อมูลเจ้าหน้าที่ล้มเหลว' });
  }
});

// ==========================================
// สำหรับดึงข้อมูลการอบรม/สัมมนาทั้งหมด 
// ==========================================
app.get('/api/trainings', async (req, res) => {
  try {
    const query = `
      SELECT 
        t_train.id, 
        t_train.teacher_id, 
        NULL AS staff_id, 
        'teacher' AS userType,
        t_train.academic_year, 
        t_train.training_type,     
        t_train.training_name, 
        t_train.location, 
        t_train.total_hours, 
        t_train.description, 
        t_train.start_date, 
        t_train.end_date,
        CONCAT(IFNULL(tch.prefix_th, ''), tch.first_name_th, ' ', tch.last_name_th) AS teacherName,
        NULL AS staffName
      FROM teacher_trainings t_train
      JOIN teachers tch ON t_train.teacher_id = tch.id

      UNION ALL

      SELECT 
        s_train.id, 
        NULL AS teacher_id, 
        s_train.staff_id, 
        'staff' AS userType,
        s_train.academic_year, 
        s_train.training_type,     
        s_train.training_name, 
        s_train.location, 
        s_train.total_hours, 
        s_train.description, 
        s_train.start_date, 
        s_train.end_date,
        NULL AS teacherName,
        CONCAT(IFNULL(stf.prefix_th, ''), stf.first_name_th, ' ', stf.last_name_th) AS staffName
      FROM staff_trainings s_train
      JOIN staffs stf ON s_train.staff_id = stf.id
      
      ORDER BY start_date DESC
    `;

    const [rows] = await db.promise().query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching trainings:', error);
    res.status(500).json({ error: 'ดึงข้อมูลการอบรมล้มเหลว' });
  }
});

// ========================================================================
// ระบบรายงานแบบสอบถาม 
// ========================================================================
// ==========================================
//ดึงรายชื่อแบบสอบถามทั้งหมด
// ==========================================
app.get('/api/surveys', (req, res) => {
  const sql = `
    SELECT 
      id, 
      code, 
      title AS name, 
      created_at AS created_date, 
      target_group AS targetGroup 
    FROM surveys 
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching surveys:", err);
      return res.status(500).json({ error: "ไม่สามารถดึงข้อมูลแบบสอบถามได้" });
    }
    res.json(results);
  });
});
// ==========================================
// ดึงข้อมูลสรุปผลคะแนนของแบบสอบถาม 
// ==========================================
app.get('/api/surveys/:id/report', (req, res) => {
  const surveyId = req.params.id;
  const sql = `
    SELECT 
      t.id AS topic_id,
      t.topic_name,
      t.order_index AS topic_order,
      q.id AS question_id,
      q.question_text,
      q.order_index AS question_order,
      COUNT(rd.score) AS total_responses,
      IFNULL(AVG(rd.score), 0) AS average_score
    FROM survey_topics t
    JOIN survey_questions q ON t.id = q.topic_id
    LEFT JOIN response_details rd ON q.id = rd.question_id
    WHERE t.survey_id = ?
    GROUP BY t.id, q.id
    ORDER BY t.order_index ASC, q.order_index ASC
  `;

  db.query(sql, [surveyId], (err, results) => {
    if (err) {
      console.error("Error calculating survey report:", err);
      return res.status(500).json({ error: "ไม่สามารถคำนวณผลสรุปแบบสอบถามได้" });
    }
    const groupedReport = [];
    const topicMap = {};

    results.forEach(row => {
      if (!topicMap[row.topic_id]) {
        topicMap[row.topic_id] = {
          topic_id: row.topic_id,
          topic_name: row.topic_name,
          questions: [],
          topic_avg: 0 
        };
        groupedReport.push(topicMap[row.topic_id]);
      }
      
      topicMap[row.topic_id].questions.push({
        question_id: row.question_id,
        question_text: row.question_text,
        average_score: parseFloat(row.average_score).toFixed(2) 
      });
    });

    groupedReport.forEach(topic => {
      if (topic.questions.length > 0) {
        const sum = topic.questions.reduce((acc, curr) => acc + parseFloat(curr.average_score), 0);
        topic.topic_avg = (sum / topic.questions.length).toFixed(2);
      }
    });

    res.json(groupedReport);
  });
});
// ==========================================
// ดึงรายชื่อแบบสอบถามทั้งหมด
// ==========================================
app.get('/api/surveys', (req, res) => {
    const sql = "SELECT * FROM surveys ORDER BY created_at DESC";
    db.query(sql, (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});
// ==========================================
// ดึงข้อมูลรายงานสรุปผล 
// ==========================================
app.get('/api/surveys/:id/report', (req, res) => {
    const surveyId = req.params.id;
    const sql = `
        SELECT 
            t.id AS topic_id, 
            t.topic_name,
            q.id AS question_id, 
            q.question_text,
            IFNULL(AVG(r.score), 0) AS average_score
        FROM survey_topics t
        JOIN survey_questions q ON t.id = q.topic_id
        LEFT JOIN survey_responses r ON q.id = r.question_id
        WHERE t.survey_id = ?
        GROUP BY q.id
        ORDER BY t.id ASC, q.id ASC
    `;

    db.query(sql, [surveyId], (err, results) => {
        if (err) return res.status(500).json(err);
        const reportData = [];
        results.forEach(row => {
            let topic = reportData.find(t => t.topic_id === row.topic_id);
            if (!topic) {
                topic = {
                    topic_name: row.topic_name,
                    topic_id: row.topic_id,
                    questions: [],
                    topic_avg: 0
                };
                reportData.push(topic);
            }
            topic.questions.push({
                question_text: row.question_text,
                average_score: parseFloat(row.average_score).toFixed(2)
            });
        });
        reportData.forEach(topic => {
            const sum = topic.questions.reduce((a, b) => a + parseFloat(b.average_score), 0);
            topic.topic_avg = (sum / topic.questions.length).toFixed(2);
        });

        res.json(reportData);
    });
});


// ========================================================================
// สร้างreport ผลงาน
// ========================================================================

app.get('/api/students', (req, res) => {
    db.query("SELECT student_id, prefix_th, first_name_th, last_name_th FROM students", (err, data) => {
        if (err) return res.json(err);
        res.json(data);
    });
});

app.get('/api/teacher-works', (req, res) => {
    const sql = "SELECT * FROM teacher_works ORDER BY academic_year DESC, work_date DESC";
    db.query(sql, (err, data) => {
        if (err) return res.json(err);
        res.json(data);
    });
});

app.get('/api/staff-works', (req, res) => {
    const sql = "SELECT * FROM staff_works ORDER BY academic_year DESC, work_date DESC";
    db.query(sql, (err, data) => {
        if (err) return res.json(err);
        res.json(data);
    });
});

app.get('/api/student-works', (req, res) => {
    const sql = "SELECT * FROM student_works ORDER BY academic_year DESC, work_date DESC";
    db.query(sql, (err, data) => {
        if (err) return res.json(err);
        res.json(data);
    });
});

// ==========================================
// ดึงข้อมูลผลงาน 
// ==========================================
app.get('/api/research/all', async (req, res) => {
    // ใช้ฟังก์ชันดึง Authors กับ Files แบบเดียวกับที่คุณทำไว้
    const getAuthorsQuery = (table, fk) => `
        COALESCE((SELECT JSON_ARRAYAGG(JSON_OBJECT(
            'id', a.id, 'prefix', a.prefix, 'prefix_en', a.prefix_en,       
            'first_name', a.first_name, 'first_name_en', a.first_name_en, 
            'last_name', a.last_name, 'last_name_en', a.last_name_en,       
            'position', a.position
        )) FROM ${table} a WHERE a.${fk} = main.id), '[]')
    `;

    const getFilesQuery = (refTable) => `
        COALESCE((SELECT JSON_ARRAYAGG(JSON_OBJECT(
            'id', f.id, 'file_name', f.file_name, 'file_path', f.file_path
        )) FROM common_files f WHERE f.ref_id = main.id AND f.ref_table = '${refTable}'), '[]')
    `;

    let allWorks = [];

    try {
        const [researches] = await db.promise().query(`SELECT main.*, 'research' as type, ${getAuthorsQuery('research_authors', 'research_id')} AS authors, ${getFilesQuery('research')} AS files FROM researches main`);
        allWorks.push(...researches);

        const [journals] = await db.promise().query(`SELECT main.*, 'journal' as type, ${getAuthorsQuery('journal_authors', 'journal_id')} AS authors, ${getFilesQuery('journal')} AS files FROM journals main`);
        allWorks.push(...journals);

        const [conferences] = await db.promise().query(`SELECT main.*, 'conference' as type, ${getAuthorsQuery('conference_authors', 'conference_id')} AS authors, ${getFilesQuery('conference')} AS files FROM conferences main`);
        allWorks.push(...conferences);

        const [books] = await db.promise().query(`SELECT main.*, 'book' as type, ${getAuthorsQuery('book_authors', 'book_id')} AS authors, ${getFilesQuery('book')} AS files FROM books main`);
        allWorks.push(...books);

        // เรียงปีล่าสุดขึ้นก่อน
        allWorks.sort((a, b) => (Number(b.academic_year) || 0) - (Number(a.academic_year) || 0));

        res.json(allWorks);
    } catch (e) {
        console.error("Error fetching all works:", e.message);
        res.status(500).json({ error: e.message });
    }
});

// ==========================================
// Start Server
// ==========================================
const PORT = 8081;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});