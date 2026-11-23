"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell, { FormError, PasswordField, SubmitButton } from "@/components/auth-shell";
import styles from "@/components/auth.module.css";
import { ApiError, api } from "@/lib/api";
import { MIN_PASSWORD, commonAuthError, focusOnDesktop, passwordLengthError, useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n/react";

// The link from the reset email: /reset-password/?token=…
export default function ResetPasswordPage() {
  const t = useT();
  return (
    // Until the token is read from the URL: the same card, empty, not a blank page.
    <Suspense fallback={<AuthShell title={t.auth.reset.title}>{null}</AuthShell>}>
      <ResetPassword />
    </Suspense>
  );
}

function ResetPassword() {
  const router = useRouter();
  const t = useT();
  const token = useSearchParams().get("token") ?? "";
  const signedIn = useAuth((s) => s.signedIn);

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState<React.ReactNode>("");
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    focusOnDesktop(passwordRef.current);
  }, []);

  const newLink = <Link href="/forgot-password/" className={styles.link}>{t.auth.reset.requestNew}</Link>;

  if (!token) {
    return (
      <AuthShell title={t.auth.reset.incompleteTitle} aside={<Link href="/login/" className={styles.link}>{t.auth.backToLogin}</Link>}>
        <div className={styles.actions}>
          <p className={styles.subtitle}>
            {t.auth.reset.incompleteText}
          </p>
          <p>{newLink}</p>
        </div>
      </AuthShell>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setFormError("");
    const lengthError = passwordLengthError(password);
    if (lengthError) {
      setError(lengthError);
      passwordRef.current?.focus();
      return;
    }
    setError("");
    setBusy(true);
    try {
      const user = await api.resetPassword(token, password);
      signedIn(user, t.auth.reset.done(user.email));
      router.replace("/");
    } catch (err) {
      setFormError(
        err instanceof ApiError && err.status === 400 ? (
          <>{t.auth.reset.expired} {newLink}.</>
        ) : (
          commonAuthError(err)
        ),
      );
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title={t.auth.reset.title}
      subtitle={t.auth.reset.subtitle}
    >
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <FormError>{formError}</FormError>
        <PasswordField
          ref={passwordRef}
          label={t.auth.newPassword}
          autoComplete="new-password"
          value={password}
          onChange={(v) => { setPassword(v); setError(""); }}
          error={error}
          hint={t.auth.passwordHint(MIN_PASSWORD)}
        />
        <SubmitButton busy={busy} busyText={t.auth.reset.busy}>{t.auth.reset.submit}</SubmitButton>
      </form>
    </AuthShell>
  );
}
