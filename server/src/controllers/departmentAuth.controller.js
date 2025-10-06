import jwt from "jsonwebtoken";
import DepartmentUser from "../models/DepartmentUser.js";

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

// POST /api/dept/register
export const registerDept = async (req, res) => {
    try {
        const { name, email, password, role, state } = req.body;   // ✅ include state
        if (!name || !email || !password || !role || !state) {
            return res.status(400).json({ error: "All fields required" });
        }

        const existing = await DepartmentUser.findOne({ email });
        if (existing) return res.status(400).json({ error: "Email already exists" });

        const user = new DepartmentUser({ name, email, role, state });
        await user.setPassword(password);
        await user.save();

        res.status(201).json({ message: "Registered successfully" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

// POST /api/dept/login
export const loginDept = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await DepartmentUser.findOne({ email });
        if (!user) return res.status(400).json({ error: "Invalid email/password" });
        const valid = await user.validatePassword(password);
        if (!valid) return res.status(400).json({ error: "Invalid email/password" });
        console.log(user);
        const token = jwt.sign(
            { id: user._id, role: user.role, state: user.state },
            JWT_SECRET,
            { expiresIn: "7d" }
        );
        return res.json({
            token,
            user: { id: user._id, name: user.name, role: user.role, state: user.state }
        });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

// GET /api/dept/ndrf-teams
export const getNDRFTeams = async (req, res) => {
    try {
        const teams = await DepartmentUser.find({ role: "NDRF" })
            .select('name email state createdAt')
            .sort({ state: 1, name: 1 });
        
        res.json({ teams });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
