import { UserRepository } from './user.repository';
import { RegisterDTO } from './dto/register.dto';
import { LoginDTO } from './dto/login.dto';
import bcrypt from 'bcrypt';

export const UserService = {
  async register(data: RegisterDTO) {
    // Check if user already exists
    const existing = await UserRepository.findByEmail(data.email);
    if (existing) throw new Error('User already exists');

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await UserRepository.createUser({ ...data, passwordHash });
    return user;
  },

  async login(data: LoginDTO) {
    const user = await UserRepository.findByEmail(data.email);
    if (!user) throw new Error('Invalid email or password');

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) throw new Error('Invalid email or password');

    // Return user (or generate JWT here)
    return user;
  }
};
