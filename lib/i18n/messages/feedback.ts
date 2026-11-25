// The feedback form, opened from the footer and from the "how it works" story.
const ru = {
  link: "Обратная связь",
  title: "Написать нам",
  subtitle: "Ошибка, непонятное место или идея — читаем каждое сообщение.",
  messageLabel: "Сообщение",
  messagePlaceholder: "Что случилось или чего не хватает?",
  emailLabel: "Email для ответа",
  emailHint: "Оставьте, если хотите получить ответ.",
  context: "Вместе с сообщением уйдут адрес страницы, версия приложения и тип браузера. Данные гаража не отправляются.",
  send: "Отправить",
  sending: "Отправляем…",
  sentTitle: "Спасибо, сообщение у нас",
  sentBody: "Прочитаем в ближайшие дни.",
  sentReply: (email: string) => `Ответим на ${email}.`,
  done: "Готово",
  count: (n: number, max: number) => `${n} из ${max}`,
  introPrompt: "Остались вопросы?",
  introLink: "Напишите нам",
  err: {
    required: "Напишите хотя бы пару слов.",
    tooLong: (max: number) => `Не длиннее ${max} символов — сократите или разбейте на два сообщения.`,
    email: "Проверьте адрес: нужны @ и домен, например name@mail.ru.",
    network: "Нет связи с сервером. Текст на месте — попробуйте ещё раз.",
    rateLimit: "Слишком много сообщений подряд. Попробуйте через час.",
    server: "Не получилось отправить. Текст на месте — попробуйте ещё раз чуть позже.",
  },
};

export type FeedbackMessages = typeof ru;

const en: FeedbackMessages = {
  link: "Feedback",
  title: "Write to us",
  subtitle: "A bug, something unclear, or an idea — we read every message.",
  messageLabel: "Message",
  messagePlaceholder: "What happened, or what's missing?",
  emailLabel: "Email for a reply",
  emailHint: "Leave it if you'd like an answer.",
  context: "Sent along with your message: the page address, the app version and the browser type. Your garage data is not sent.",
  send: "Send",
  sending: "Sending…",
  sentTitle: "Thanks, we've got it",
  sentBody: "We'll read it in the next few days.",
  sentReply: (email: string) => `We'll reply to ${email}.`,
  done: "Done",
  count: (n: number, max: number) => `${n} of ${max}`,
  introPrompt: "Still have questions?",
  introLink: "Write to us",
  err: {
    required: "Write at least a few words.",
    tooLong: (max: number) => `Keep it under ${max} characters — shorten it or split it into two messages.`,
    email: "Check the address: it needs an @ and a domain, like name@mail.com.",
    network: "Can't reach the server. Your text is still here — try again.",
    rateLimit: "Too many messages in a row. Try again in an hour.",
    server: "Couldn't send it. Your text is still here — try again a little later.",
  },
};

export const feedback = { ru, en };
