import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="page">
      <div className="wrap" style={{ maxWidth: 440 }}>
        <h1 style={{ fontSize: 48 }}>Вход</h1>
        <LoginForm />
      </div>
    </main>
  );
}
