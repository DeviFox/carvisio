"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import shell from "@/app/page.module.css";
import styles from "./account-control.module.css";
import { UserIcon } from "./icons";
import { commonAuthError, useAuth } from "@/lib/auth";
import { flushBeforeLogout } from "@/lib/sync";
import { useT } from "@/lib/i18n/react";

type Props = {
  // Phones: an icon only, the top bar has no room for a word.
  compact?: boolean;
};

// Guest: a quiet "Войти". Signed in: the person icon opens a small panel with
// the account's email and "Выйти".
export default function AccountControl({ compact }: Props) {
  const t = useT();
  const status = useAuth((s) => s.status);
  const user = useAuth((s) => s.user);
  const load = useAuth((s) => s.load);
  const logout = useAuth((s) => s.logout);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(load, [load]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Until /api/me answers, hold the guest control's exact footprint, invisibly:
  // most visitors are guests, so the row doesn't jump when the answer lands.
  if (status === "unknown") {
    return compact ? (
      <span className={styles.placeholder} aria-hidden="true" />
    ) : (
      <span className={`${styles.signIn} ${styles.ghost}`} aria-hidden="true">
        <UserIcon />
        {t.auth.signIn}
      </span>
    );
  }

  if (status === "guest" || !user) {
    return compact ? (
      <Link href="/login/" className={shell.toolBtn} aria-label={t.auth.signIn} title={t.auth.signIn}>
        <UserIcon />
      </Link>
    ) : (
      <Link href="/login/" className={styles.signIn}>
        <UserIcon />
        {t.auth.signIn}
      </Link>
    );
  }

  async function onLogout() {
    setBusy(true);
    setError("");
    try {
      // Changes not yet on the server would be lost with the session.
      await flushBeforeLogout();
    } catch {
      setError(t.auth.account.unsynced);
      setBusy(false);
      return;
    }
    try {
      await logout();
      setOpen(false);
    } catch (err) {
      setError(commonAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      ref={rootRef}
      className={styles.root}
      // Tabbing away (either direction) closes the panel instead of leaving it over the page.
      onBlur={(e) => {
        if (open && !rootRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`${shell.toolBtn} ${styles.trigger}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t.auth.account.label(user.email)}
        title={user.email}
      >
        {/* The account's initial, not the guest's person icon: signed in and
            signed out must look different at a glance. */}
        <span className={styles.avatar} aria-hidden="true">{initial(user.email)}</span>
      </button>
      {open ? (
        <div id={panelId} className={styles.panel}>
          <div className={styles.who}>
            <span className={styles.whoLabel}>{t.auth.account.signedInAs}</span>
            <span className={styles.email}>{user.email}</span>
          </div>
          <button type="button" className={styles.logout} onClick={onLogout} disabled={busy}>
            {busy ? t.auth.account.signingOut : t.auth.account.signOut}
          </button>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function initial(email: string): string {
  return ([...email.trim()][0] ?? "?").toLocaleUpperCase();
}
