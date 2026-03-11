import { User } from '../models/User.js';
import bcrypt from 'bcryptjs';
const DEFAULT_ADMIN_EMAIL = 'admin@khatushyambooks.com';
const DEFAULT_ADMIN_PASSWORD = 'Admin@123';
export async function seedAdmin() {
    const existing = await User.findOne({ role: 'admin' });
    if (existing)
        return;
    const hash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
    await User.create({
        name: 'Admin',
        email: DEFAULT_ADMIN_EMAIL,
        passwordHash: hash,
        role: 'admin',
    });
    console.log('Default admin created:', DEFAULT_ADMIN_EMAIL);
}
