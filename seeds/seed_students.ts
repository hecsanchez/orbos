import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';

const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://orbos:orbos@localhost:5432/orbos';

const db = drizzle(databaseUrl);

const students = [
  { name: 'Ana', age: 5, grade_target: 1, interests: ['animales', 'colores', 'música'] },
  { name: 'Miguel', age: 8, grade_target: 3, interests: ['dinosaurios', 'deportes', 'espacio'] },
  { name: 'Sofia', age: 11, grade_target: 5, interests: ['naturaleza', 'arte', 'tecnología'] },
];

async function main() {
  for (const s of students) {
    const existingResult = await db.execute(
      sql`SELECT id FROM students WHERE name = ${s.name} LIMIT 1`,
    );

    if (existingResult.rows.length > 0) {
      console.log(`Student "${s.name}" already exists: ${(existingResult.rows[0] as any).id}`);
      continue;
    }

    const insertResult = await db.execute(
      sql`INSERT INTO students (name, age, grade_target, interests)
          VALUES (${s.name}, ${s.age}, ${s.grade_target}, ${JSON.stringify(s.interests)}::jsonb)
          RETURNING id`,
    );

    console.log(`Created student "${s.name}": ${(insertResult.rows[0] as any).id}`);
  }

  console.log('Done seeding students.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
