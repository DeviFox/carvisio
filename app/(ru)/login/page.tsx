"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell, { EmailField, FormError, PasswordField, SubmitButton } from "@/components/auth-shell";
import styles from "@/components/auth.module.css";
import { ApiError, api } from "@/lib/api";
import { emailFormatError, commonAuthError, focusOnDesktop, looksLikeEmail, useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n/react";

type Errors = { email?: string; password?: string };

export default function LoginPage() {
  const router = useRouter();
  const t = useT();
  const status = useAuth((s) => s.status);
  const signedIn = useAuth((s) => s.signedIn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    useAuth.getState().load();
    focusOnDesktop(emailRef.current);
  }, []);

  // Already signed in (opened from a bookmark): nothing to do here.
  useEffect(() => {
    if (status === "user" && !busy) router.replace("/");
  }, [status, busy, router]);

  // A field's message goes away as soon as the owner starts fixing it.
  const clear = (field: keyof Errors) => setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const next: Errors = {};
    if (!looksLikeEmail(email)) next.email = emailFormatError();
    if (!password) next.password = t.auth.login.enterPassword;
    setErrors(next);
    setFormError("");
    if (next.email) return emailRef.current?.focus();
    if (next.password) return passwordRef.current?.focus();

    setBusy(true);
    try {
      const user = await api.login(email.trim(), password);
      signedIn(user, t.auth.login.signedIn(user.email));
      router.replace("/");
    } catch (err) {
      setFormError(
        err instanceof ApiError && err.status === 401
          ? t.auth.login.wrong
          : commonAuthError(err),
      );
      setBusy(false);
    }
  }

  // Signed in and on the way to the garage: don't flash the form.
  if (status === "user" && !busy) return null;

  return (
    <AuthShell
      title={t.auth.login.title}
      aside={<>{t.auth.login.noAccount} <Link href="/register/" className={styles.link}>{t.auth.login.register}</Link></>}
    >
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <FormError>{formError}</FormError>
        <EmailField
          ref={emailRef}
          value={email}
          onChange={(v) => { setEmail(v); clear("email"); }}
          error={errors.email}
        />
        <PasswordField
          ref={passwordRef}
          label={t.auth.password}
          autoComplete="current-password"
          value={password}
          onChange={(v) => { setPassword(v); clear("password"); }}
          error={errors.password}
          labelAside={<Link href="/forgot-password/" className={styles.labelLink}>{t.auth.login.forgot}</Link>}
        />
        <SubmitButton busy={busy} busyText={t.auth.login.busy}>{t.auth.signIn}</SubmitButton>
      </form>
    </AuthShell>
  );
}
