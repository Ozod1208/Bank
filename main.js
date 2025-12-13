const express = require('express');
const fs = require('fs');

const app = express();
app.use(express.json());

const ADMIN_CREDENTIALS = { username: "OZOD", password: "12082010" };

// ===== PATHLAR =====
const DATA_FILE = "data.json";

// ===== YORDAMCHI =====
function readAccounts() {
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function writeAccounts(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function isAdmin(user, pass) {
    return user === ADMIN_CREDENTIALS.username &&
           pass === ADMIN_CREDENTIALS.password;
}

/* ================= ADMIN ================= */

// ADMIN LOGIN
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (isAdmin(username, password))
        return res.json({ status: "ok" });
    res.json({ status: "error" });
});

// ADMIN DATA
app.get('/admin/data', (req, res) => {
    const { adminuser, adminpass } = req.headers;
    if (!isAdmin(adminuser, adminpass))
        return res.json({ status: "error", message: "Admin emas" });

    res.json({ status: "ok", data: readAccounts() });
});

// ADMIN CHANGE PASSWORD
app.post('/admin/change-password', (req, res) => {
    const { adminUser, adminPass, username, newPassword } = req.body;
    if (!isAdmin(adminUser, adminPass))
        return res.json({ status: "error" });

    const acc = readAccounts();
    const u = acc.find(a => a.username === username);
    if (!u) return res.json({ status: "error", message: "Topilmadi" });

    u.password = newPassword;
    writeAccounts(acc);
    res.json({ status: "ok", message: "Parol o‘zgartirildi" });
});

// ADMIN DELETE USER
app.delete('/admin/user/:username', (req, res) => {
    const { adminuser, adminpass } = req.headers;
    if (!isAdmin(adminuser, adminpass))
        return res.json({ status: "error" });

    let acc = readAccounts();
    acc = acc.filter(a => a.username !== req.params.username);
    writeAccounts(acc);
    res.json({ status: "ok", message: "User o‘chirildi" });
});

// ADMIN UPDATE DATA.JSON
app.post('/admin/update-data', (req, res) => {
    const { adminUser, adminPass, newData } = req.body;
    if (!isAdmin(adminUser, adminPass))
        return res.json({ status: "error" });

    writeAccounts(newData);
    res.json({ status: "ok", message: "Data yangilandi" });
});

/* ================= USER ================= */

// SIGNUP
app.post('/signup', (req, res) => {
    const acc = readAccounts();
    if (acc.find(a => a.username === req.body.username))
        return res.json({ status: "error" });

    acc.push({ ...req.body, amount: 10000 });
    writeAccounts(acc);
    res.json({ status: "ok" });
});

// LOGIN
app.post('/login', (req, res) => {
    const acc = readAccounts();
    const u = acc.find(a =>
        a.username === req.body.username &&
        a.password === req.body.password
    );
    if (!u) return res.json({ status: "error" });
    res.json({ status: "ok", user: u });
});

// TRANSACTION (demo uchun)
app.post('/transaction', (req, res) => {
    const acc = readAccounts();
    const u = acc.find(a => a.username === req.body.username);
    if (!u) return res.json({ status: "error" });

    const amountChange = Number(req.body.amount);
    if (req.body.action === "deposit") {
        u.amount += amountChange;
    } else if (req.body.action === "withdraw") {
        u.amount -= amountChange;
    }

    writeAccounts(acc);
    res.json({ status: "ok", user: u });
});

// DELETE USER
app.delete('/user', (req, res) => {
    let acc = readAccounts();
    acc = acc.filter(a =>
        !(a.username === req.body.username &&
          a.password === req.body.password)
    );
    writeAccounts(acc);
    res.json({ status: "ok", message: "Hisob o‘chirildi" });
});

// ===== RENDER PORT =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
    console.log(`✅ Server running on port ${PORT}`)
);
