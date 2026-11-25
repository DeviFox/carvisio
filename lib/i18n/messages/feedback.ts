// The feedback form, opened from the footer and from the "how it works" story.
const ru = {
  link: "Написать нам",
  title: "Написать нам",
  subtitle: "Нашли ошибку или есть идея — поделитесь.",
  messageLabel: "Сообщение",
  messagePlaceholder: "Поделитесь проблемой или предложением",
  emailLabel: "Почта для ответа",
  context: "",
  send: "Отправить",
  sending: "Отправляем…",
  sentTitle: "Спасибо!",
  sentBody: "Всё прочитаем.",
  sentReply: (email: string) => `Ответим на ${email}.`,
  done: "Готово",
  count: (n: number, max: number) => `${n} из ${max}`,
  introPrompt: "Остались вопросы?",
  introLink: "Напишите нам",
  err: {
    required: "Напишите сообщение.",
    tooLong: (max: number) => `Максимум ${max} символов.`,
    email: "Кажется, в адресе опечатка.",
    network: "Нет подключения. Попробуйте ещё раз.",
    rateLimit: "Слишком много сообщений подряд. Попробуйте через час.",
    server: "Не удалось отправить. Попробуйте позже.",
  },
};

export type FeedbackMessages = typeof ru;

const en: FeedbackMessages = {
  link: "Write to us",
  title: "Write to us",
  subtitle: "Found a bug or have an idea? Tell us.",
  messageLabel: "Message",
  messagePlaceholder: "Bring your idea or problem to us",
  emailLabel: "Email for a reply",
  context: "",
  send: "Send",
  sending: "Sending…",
  sentTitle: "Thank you!",
  sentBody: "We'll read every word.",
  sentReply: (email: string) => `We'll reply to ${email}.`,
  done: "Done",
  count: (n: number, max: number) => `${n} of ${max}`,
  introPrompt: "Still have questions?",
  introLink: "Write to us",
  err: {
    required: "Write a message.",
    tooLong: (max: number) => ` ${max} characters max.`,
    email: "Looks like a typo in the address.",
    network: "No connection. Please try again.",
    rateLimit: "Too many messages in a row. Try again in an hour.",
    server: "Couldn't send. Try again later.",
  },
};

export const feedback = { ru, en };
