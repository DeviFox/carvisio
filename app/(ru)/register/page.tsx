"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell, { EmailField, FormError, PasswordField, SubmitButton } from "@/components/auth-shell";
import styles from "@/components/auth.module.css";
import { ApiError, api } from "@/lib/api";
import {
  emailFormatError,
  MIN_PASSWORD,
  commonAuthError,
  focusOnDesktop,
  looksLikeEmail,
  passwordLengthError,
  useAuth,
} from "@/lib/auth";
import { useT } from "@/lib/i18n/react";

type Errors = { email?: string; password?: string };

export default function RegisterPage() {
  const router = useRouter();
  const t = useT();
  const status = useAuth((s) => s.status);
  const signedIn = useAuth((s) => s.signedIn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<React.ReactNode>("");
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    useAuth.getState().load();
    focusOnDesktop(emailRef.current);
  }, []);

  useEffect(() => {
    if (status === "user" && !busy) router.replace("/");
  }, [status, busy, router]);

  const clear = (field: keyof Errors) => setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const next: Errors = {};
    if (!looksLikeEmail(email)) next.email = emailFormatError();
    next.password = passwordLengthError(password);
    setErrors(next);
    setFormError("");
    if (next.email) return emailRef.current?.focus();
    if (next.password) return passwordRef.current?.focus();

    setBusy(true);
    try {
      const user = await api.register(email.trim(), password);
      signedIn(user, t.auth.register.created(user.email));
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setFormError(
          <>
            {t.auth.register.taken} <Link href="/login/" className={styles.link}>{t.auth.signIn}</Link> {t.auth.register.or}{" "}
            <Link href="/forgot-password/" className={styles.link}>{t.auth.register.restore}</Link>.
          </>,
        );
      } else {
        setFormError(commonAuthError(err));
      }
      setBusy(false);
    }
  }

  if (status === "user" && !busy) return null;

  return (
    <AuthShell
      title={t.auth.register.title}
      subtitle={t.auth.register.subtitle}
      aside={<>{t.auth.register.haveAccount} <Link href="/login/" className={styles.link}>{t.auth.signIn}</Link></>}
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
          autoComplete="new-password"
          value={password}
          onChange={(v) => { setPassword(v); clear("password"); }}
          error={errors.password}
          hint={t.auth.passwordHint(MIN_PASSWORD)}
        />
        <SubmitButton busy={busy} busyText={t.auth.register.busy}>{t.auth.register.submit}</SubmitButton>
      </form>
    </AuthShell>
  );
}
