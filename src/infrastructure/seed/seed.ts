import { container } from '../bootstrap/container.js';
import { AppResult, AppError } from '@carbonteq/hexapp';
import { db } from '../persistence/db.js';
import { users } from '../persistence/schemas/user.schema.js';
import { documents } from '../persistence/schemas/document.schema.js';
import type { UserRepositoryPort } from '../../application/ports/UserRepositoryPort.js';
import type { DocumentRepositoryPort } from '../../application/ports/DocumentRepositoryPort.js';
import type { AuthPort } from '../../application/ports/AuthPort.js';
import { UserFactory } from '../../domain/entities/user/UserFactory.js';
import { DocumentFactory } from '../../domain/entities/document/DocumentFactory.js';

type SeedOptions = { reset?: boolean; clearOnly?: boolean };

function randomFrom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomTags(): string[] {
  const pool = ['finance', 'hr', 'legal', 'invoice', 'receipt', 'contract', 'report', 'image', 'pdf', 'txt'];
  const count = 1 + Math.floor(Math.random() * 4);
  const tags = new Set<string>();
  while (tags.size < count) tags.add(randomFrom(pool));
  return Array.from(tags);
}

export async function runSeed(options: SeedOptions = {}): Promise<AppResult<void>> {
  const userRepo = container.resolve<UserRepositoryPort>('UserRepositoryPort');
  const docRepo = container.resolve<DocumentRepositoryPort>('DocumentRepositoryPort');
  const auth = container.resolve<AuthPort>('AuthPort');

  if (options.reset || options.clearOnly) {
    // Danger: destructive reset
    await db.delete(documents);
    await db.delete(users);
    if (options.clearOnly) {
      return AppResult.Ok(undefined); // Stop here if only clearing
    }
  }

  // Ensure admin user
  const adminEmail = 'admin@example.com';
  const adminPassword = 'Admin@123';
  const adminHash = await auth.hashPassword(adminPassword);
  if (adminHash.isErr()) return AppResult.Err(AppError.Generic('Failed to hash admin password'));
  const admin = UserFactory.createAdminUser('Admin User', adminEmail, adminHash.unwrap());
  if (admin.isErr()) return AppResult.Err(admin.unwrapErr());
  const createdAdmin = await userRepo.createUser(admin.unwrap());
  if (createdAdmin.isErr()) return AppResult.Err(createdAdmin.unwrapErr());

  // Create regular users
  for (let i = 0; i < 5; i++) {
    const email = `user${Date.now()}_${i}@example.com`;
    const pass = await auth.hashPassword('User@123');
    if (pass.isErr()) return AppResult.Err(pass.unwrapErr());
    const userRes = UserFactory.createRegularUser(`User ${i + 1}`, email, pass.unwrap());
    if (userRes.isErr()) return AppResult.Err(userRes.unwrapErr());
    const userCreate = await userRepo.createUser(userRes.unwrap());
    if (userCreate.isErr()) return AppResult.Err(userCreate.unwrapErr());
  }

  // Load all users to attach documents
  const allUsersRes = await userRepo.getAllUsers();
  if (allUsersRes.isErr()) return AppResult.Err(allUsersRes.unwrapErr());
  const allUsers = allUsersRes.unwrap().data;

  // Seed documents
  for (const u of allUsers) {
    for (let i = 0; i < 4; i++) {
      const ext = randomFrom(['.pdf', '.txt', '.png']);
      const filename = `sample-${i}${ext}`;
      const mimetype = ext === '.pdf' ? 'application/pdf' : ext === '.txt' ? 'text/plain' : 'image/png';
      const path = `${process.cwd()}/uploads/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      const docRes = DocumentFactory.createDocument({ filename, mimetype, path, tags: randomTags(), description: 'seeded file', userId: u.id });
      if (docRes.isErr()) return AppResult.Err(docRes.unwrapErr());
      const created = await docRepo.createDocument(docRes.unwrap());
      if (created.isErr()) return AppResult.Err(created.unwrapErr());
    }
  }
  return AppResult.Ok(undefined);
}

