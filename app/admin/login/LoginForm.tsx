"use client";
import { useActionState } from "react";
import { loginAction } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="panel">
      <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="username" maxLength={120} /></div>
      <div className="field"><label htmlFor="password">Пароль</label><input id="password" name="password" type="password" required autoComplete="current-password" maxLength={200} /></div>
      <div className="err" role="alert">{state?.error}</div>
      <button className="btn solid" type="submit" disabled={pending}>{pending ? "Проверяю…" : "Войти"}</button>
    </form>
  );
}
