export default function SetupPage() {
  return (
    <main className="min-h-screen bg-[#FDF5E6] px-6 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-black uppercase tracking-widest text-slate-800">Setup</h1>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Database</h2>
          <p className="text-sm font-semibold text-slate-600 mb-4">
            Create a local MySQL database named <span className="font-black">voicetask</span> and run this SQL in phpMyAdmin:
          </p>
          <pre className="whitespace-pre-wrap rounded-2xl bg-slate-900 p-4 text-[12px] text-slate-100">
{`CREATE DATABASE IF NOT EXISTS voicetask;
USE voicetask;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  image VARCHAR(512),
  password_hash VARCHAR(255),
  provider VARCHAR(32) NOT NULL DEFAULT 'credentials',
  provider_account_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY provider_account_unique (provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS todos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at BIGINT NOT NULL,
  due_date VARCHAR(32),
  due_time VARCHAR(10),
  location VARCHAR(255),
  sort_timestamp BIGINT NOT NULL,
  type ENUM('task','event') NOT NULL,
  priority ENUM('low','normal','high') NOT NULL,
  subtasks JSON,
  CONSTRAINT fk_todos_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id BIGINT PRIMARY KEY,
  active_tab ENUM('task','event') NOT NULL DEFAULT 'task',
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  active_date_filters JSON,
  filter_task VARCHAR(20) NOT NULL DEFAULT 'all',
  filter_event VARCHAR(20) NOT NULL DEFAULT 'all',
  calendar_month VARCHAR(7),
  default_language VARCHAR(10),
  default_active_tab ENUM('task','event'),
  default_show_subtasks BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT fk_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);`}
          </pre>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Environment</h2>
          <p className="text-sm font-semibold text-slate-600 mb-4">
            Add these to <span className="font-black">.env.local</span>:
          </p>
          <pre className="whitespace-pre-wrap rounded-2xl bg-slate-900 p-4 text-[12px] text-slate-100">
{`MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=voicetask

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret`}
          </pre>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">OAuth Callbacks</h2>
          <p className="text-sm font-semibold text-slate-600">
            Set OAuth callback URL to:
          </p>
          <pre className="whitespace-pre-wrap rounded-2xl bg-slate-900 p-4 text-[12px] text-slate-100">
{`http://localhost:3000/api/auth/callback/google
http://localhost:3000/api/auth/callback/facebook`}
          </pre>
        </section>
      </div>
    </main>
  );
}
