const express = require('express');
const fs = require('fs');

const app = express();
app.use(express.json());

/* ================= CONFIG ================= */

const ADMIN_CREDENTIALS = {
    username: "OZOD",
    password: "12082010"
};

const DATA_FILE = "data.json";

/* ================= HELPERS ================= */

function readAccounts() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, "[]");
    }
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
    if (isAdmin(username, password)) {
        return res.json({ status: "ok" });
    }
    res.json({ status: "error" });
});

// ADMIN GET ALL DATA
app.get('/admin/data', (req, res) => {
    const { adminuser, adminpass } = req.headers;

    if (!isAdmin(adminuser, adminpass)) {
        return res.json({ status: "error", message: "Admin emas" });
    }

    res.json({ status: "ok", data: readAccounts() });
});

// ADMIN CHANGE USER PASSWORD
app.post('/admin/change-password', (req, res) => {
    const { adminUser, adminPass, username, newPassword } = req.body;

    if (!isAdmin(adminUser, adminPass)) {
        return res.json({ status: "error" });
    }

    const acc = readAccounts();
    const user = acc.find(u => u.username === username);

    if (!user) {
        return res.json({ status: "error", message: "User topilmadi" });
    }

    user.password = newPassword;
    writeAccounts(acc);

    res.json({ status: "ok", message: "Parol o‘zgartirildi" });
});

// ADMIN DELETE USER
app.delete('/admin/user/:username', (req, res) => {
    const { adminuser, adminpass } = req.headers;

    if (!isAdmin(adminuser, adminpass)) {
        return res.json({ status: "error" });
    }

    let acc = readAccounts();
    acc = acc.filter(u => u.username !== req.params.username);
    writeAccounts(acc);

    res.json({ status: "ok", message: "User o‘chirildi" });
});

// ADMIN UPDATE FULL DATA
app.post('/admin/update-data', (req, res) => {
    const { adminUser, adminPass, newData } = req.body;

    if (!isAdmin(adminUser, adminPass)) {
        return res.json({ status: "error" });
    }

    writeAccounts(newData);
    res.json({ status: "ok", message: "Data yangilandi" });
});

/* ================= USER ================= */

// SIGNUP
app.post('/signup', (req, res) => {
    const acc = readAccounts();

    if (acc.find(u => u.username === req.body.username)) {
        return res.json({ status: "error", message: "Username band" });
    }

    acc.push({
        username: req.body.username,
        password: req.body.password,
        amount: 10000
    });

    writeAccounts(acc);
    res.json({ status: "ok" });
});

// LOGIN
app.post('/login', (req, res) => {
    const acc = readAccounts();

    const user = acc.find(u =>
        u.username === req.body.username &&
        u.password === req.body.password
    );

    if (!user) {
        return res.json({ status: "error" });
    }

    res.json({ status: "ok", user });
});

// TRANSACTION (DEPOSIT / WITHDRAW)
app.post('/transaction', (req, res) => {
    const acc = readAccounts();
    const user = acc.find(u => u.username === req.body.username);

    if (!user) {
        return res.json({ status: "error", message: "User topilmadi" });
    }

    const amount = Number(req.body.amount);
    const action = req.body.action;

    if (isNaN(amount) || amount <= 0) {
        return res.json({ status: "error", message: "Noto‘g‘ri summa" });
    }

    if (!["deposit", "withdraw"].includes(action)) {
        return res.json({ status: "error", message: "Noto‘g‘ri amal" });
    }

    if (action === "withdraw" && user.amount < amount) {
        return res.json({ status: "error", message: "Balans yetarli emas" });
    }

    if (action === "deposit") {
        user.amount += amount;
    } else {
        user.amount -= amount;
    }

    writeAccounts(acc);
    res.json({ status: "ok", user });
});

// DELETE USER (self)
app.delete('/user', (req, res) => {
    let acc = readAccounts();

    acc = acc.filter(u =>
        !(u.username === req.body.username &&
          u.password === req.body.password)
    );

    writeAccounts(acc);
    res.json({ status: "ok", message: "Hisob o‘chirildi" });
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});


