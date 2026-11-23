"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import AuthShell, { EmailField, FormError, FormSuccess, SubmitButton } from "@/components/auth-shell";
import styles from "@/components/auth.module.css";
import { api } from "@/lib/api";
import { emailFormatError, commonAuthError, focusOnDesktop, looksLikeEmail } from "@/lib/auth";
import { useT } from "@/lib/i18n/react";

export default function ForgotPasswordPage() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  // The address the link went to; the server never says whether it exists.
  const [sentTo, setSentTo] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const sentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    focusOnDesktop(emailRef.current);
  }, []);

  // The form is gone once the link is sent: move focus to the news, not to <body>.
  useEffect(() => {
    if (sentTo) sentRef.current?.focus();
  }, [sentTo]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setFormError("");
    if (!looksLikeEmail(email)) {
      setError(emailFormatError());
      emailRef.current?.focus();
      return;
    }
    setError("");
    setBusy(true);
    try {
      await api.forgotPassword(email.trim());
      setSentTo(email.trim());
    } catch (err) {
      setFormError(commonAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  if (sentTo) {
    return (
      <AuthShell
        title={t.auth.forgot.sentTitle}
        aside={<Link href="/login/" className={styles.link}>{t.auth.backToLogin}</Link>}
      >
        <div ref={sentRef} className={styles.actions} tabIndex={-1}>
          <FormSuccess>
            {t.auth.forgot.sentBefore} <strong>{sentTo}</strong> {t.auth.forgot.sentAfter}
          </FormSuccess>
          <p className={styles.subtitle}>
            {t.auth.forgot.noEmail}{" "}
            <button type="button" className={styles.link} onClick={() => setSentTo("")}>
              {t.auth.forgot.resend}
            </button>
            .
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t.auth.forgot.title}
      subtitle={t.auth.forgot.subtitle}
      aside={<>{t.auth.forgot.remembered} <Link href="/login/" className={styles.link}>{t.auth.signIn}</Link></>}
    >
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <FormError>{formError}</FormError>
        <EmailField
          ref={emailRef}
          autoComplete="email"
          value={email}
          onChange={(v) => { setEmail(v); setError(""); }}
          error={error}
        />
        <SubmitButton busy={busy} busyText={t.auth.forgot.busy}>{t.auth.forgot.submit}</SubmitButton>
      </form>
    </AuthShell>
  );
}
