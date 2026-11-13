const postgres = require('/app/node_modules/postgres');
const { hash } = require('/app/node_modules/@node-rs/argon2');
const { hashToken } = require('/app/dist/common/token.util');
const { USER_ROLE, LANGUAGE } = require('/app/node_modules/@tanuki/contracts');

const main = async () => {
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  try {
    const passwordHash = await hash('Load-password-123');
    for (let i = 0; i < 200; i += 1) {
      const [user] =
        await sql`INSERT INTO users (email, username, password_hash, role, language, email_verified_at)
        VALUES (${`load${i}@example.invalid`}, ${`load_${i}`}, ${passwordHash}, ${USER_ROLE.USER}, ${LANGUAGE.RU}, now()) RETURNING id`;
      await sql`INSERT INTO sessions (user_id, token_hash, remember, expires_at)
        VALUES (${user.id}, ${hashToken(`load-session-${i}`)}, true, now() + interval '1 day')`;
    }
    console.log('Seeded 200 verified users and sessions in the temporary database');
  } finally {
    await sql.end();
  }
};
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
