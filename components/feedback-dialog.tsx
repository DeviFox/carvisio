"use client";

import { FormEvent, useId, useRef, useState } from "react";
import d from "./dialog.module.css";
import s from "./feedback-dialog.module.css";
import { ArrowRightIcon, CheckIcon, CloseIcon } from "./icons";
import { useConfirmClose, useModal } from "@/lib/use-modal";
import { ApiError, api } from "@/lib/api";
import { looksLikeEmail, useAuth } from "@/lib/auth";
import { APP_VERSION, FEEDBACK_MAX, useFeedback } from "@/lib/feedback";
import { useT } from "@/lib/i18n/react";

// Mounted once in the footer; opened through useFeedback from anywhere.
export default function FeedbackHost() {
  const open = useFeedback((st) => st.open);
  const hide = useFeedback((st) => st.hide);
  // Remounted on every open: a fresh form, prefilled from the account.
  return open ? <FeedbackDialog onClose={hide} /> : null;
}

type Status = "idle" | "sending" | "sent";

function FeedbackDialog({ onClose }: { onClose: () => void }) {
  const t = useT();
  const f = t.feedback;
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const doneRef = useRef<HTMLButtonElement>(null);
  const accountEmail = useAuth((st) => st.user?.email ?? "");

  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(accountEmail);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // Typed text is not thrown away by a stray Esc; once sent, nothing is at stake.
  const confirmClose = useConfirmClose([message, email], onClose);
  const dismiss = status === "sent" ? onClose : confirmClose;
  const { overlayClick, trapTab } = useModal(true, dismiss, messageRef);

  const length = [...message].length;
  const over = length > FEEDBACK_MAX;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    const text = message.trim();
    const mail = email.trim();
    const msgErr = !text ? f.err.required : over ? f.err.tooLong(FEEDBACK_MAX) : null;
    const mailErr = mail && !looksLikeEmail(mail) ? f.err.email : null;
    setMessageError(msgErr);
    setEmailError(mailErr);
    setSendError(null);
    if (msgErr) return messageRef.current?.focus();
    if (mailErr) return;

    setStatus("sending");
    try {
      await api.feedback({
        message: text,
        email: mail || undefined,
        page: window.location.pathname,
        appVersion: APP_VERSION,
        website,
      });
      setStatus("sent");
      requestAnimationFrame(() => doneRef.current?.focus());
    } catch (err) {
      setStatus("idle");
      if (err instanceof ApiError && err.status === 422 && err.message.includes("email")) {
        setEmailError(f.err.email);
      } else {
        setSendError(
          err instanceof ApiError && err.status === 0 ? f.err.network
            : err instanceof ApiError && err.status === 429 ? f.err.rateLimit
            : f.err.server,
        );
      }
    }
  }

  return (
    <div className={d.overlay} onClick={overlayClick} role="presentation">
      <div
        ref={dialogRef}
        className={`${d.dialog} ${d.narrow}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(e) => trapTab(e, dialogRef.current)}
      >
        <div className={d.header}>
          <div className={d.titleGroup}>
            <h2 className={d.title} id={titleId}>{status === "sent" ? f.sentTitle : f.title}</h2>
            {status === "sent" ? null : <p className={d.subtitle}>{f.subtitle}</p>}
          </div>
          <button type="button" className={d.close} onClick={dismiss} aria-label={t.common.close}>
            <CloseIcon />
          </button>
        </div>

        {status === "sent" ? (
          <div className={s.sent} role="status">
            <span className={s.sentMark} aria-hidden="true"><CheckIcon /></span>
            <p className={s.sentText}>
              {f.sentBody}
              {email.trim() ? <> {f.sentReply(email.trim())}</> : null}
            </p>
            <div className={s.sentActions}>
              <button ref={doneRef} type="button" className={d.primary} onClick={onClose}>{f.done}</button>
            </div>
          </div>
        ) : (
          <form className={d.form} onSubmit={onSubmit} noValidate>
            <div className={d.field}>
              <label className={d.label} htmlFor="fb-message">
                {f.messageLabel} <span className={d.required} aria-hidden="true">*</span>
              </label>
              <textarea
                id="fb-message"
                ref={messageRef}
                className={`${d.textarea} ${s.message} ${messageError ? d.invalid : ""}`}
                placeholder={f.messagePlaceholder}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (messageError) setMessageError(null);
                }}
                aria-invalid={!!messageError}
                aria-describedby="fb-message-note"
                required
              />
              <div className={s.messageNote} id="fb-message-note">
                {messageError ? <span className={d.error}>{messageError}</span> : <span />}
                {/* Only near the limit: a counter from the first key is pressure, not help. */}
                {length > FEEDBACK_MAX * 0.8 ? (
                  <span className={`${s.count} ${over ? s.countOver : ""} numeric`}>{f.count(length, FEEDBACK_MAX)}</span>
                ) : null}
              </div>
            </div>

            <div className={d.field}>
              <label className={d.label} htmlFor="fb-email">
                {f.emailLabel} <span className={d.optional}>{t.common.optional}</span>
              </label>
              <input
                id="fb-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                className={`${d.input} ${emailError ? d.invalid : ""}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "fb-email-note" : undefined}
              />
              {emailError ? <span className={d.error} id="fb-email-note">{emailError}</span> : null}
            </div>

            {/* Honeypot: off-screen and out of the tab order; only bots fill it. */}
            <input
              className={s.trap}
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />

            <p className={s.context}>{f.context}</p>

            {sendError ? <p className={s.sendError} role="alert">{sendError}</p> : null}

            <div className={d.footer}>
              <button type="button" className={d.ghostBtn} onClick={dismiss}>{t.common.cancel}</button>
              <button type="submit" className={d.primary} disabled={status === "sending"} aria-busy={status === "sending"}>
                {status === "sending" ? f.sending : f.send}
                {status === "sending" ? null : <ArrowRightIcon />}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
