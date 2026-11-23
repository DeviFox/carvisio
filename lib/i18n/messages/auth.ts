import { plural } from "../format";

// Account: sign-in, registration, password reset, the account control and
// the cloud-sync notices.
const ru = {
  toGarage: "В гараж",
  email: "Почта",
  password: "Пароль",
  newPassword: "Новый пароль",
  showPassword: "Показать пароль",
  capsLock: "Включён Caps Lock",
  passwordHint: (n: number) => `Не менее ${n} символов`,
  closeNotice: "Закрыть уведомление",
  backToLogin: "Вернуться ко входу",
  signIn: "Войти",

  login: {
    title: "Вход",
    noAccount: "Нет аккаунта?",
    register: "Зарегистрироваться",
    forgot: "Забыли пароль?",
    busy: "Входим…",
    enterPassword: "Введите пароль",
    wrong: "Неверная почта или пароль.",
    signedIn: (email: string) => `Вы вошли как ${email}.`,
  },
  register: {
    title: "Регистрация",
    subtitle: "Ваш гараж будет храниться в облаке. Машины из этого устройства перенесутся в него.",
    haveAccount: "Уже есть аккаунт?",
    submit: "Создать аккаунт",
    busy: "Создаём аккаунт…",
    created: (email: string) => `Аккаунт создан: ${email}.`,
    taken: "Эта почта уже зарегистрирована.",
    or: "или",
    restore: "восстановить пароль",
  },
  forgot: {
    title: "Восстановление пароля",
    subtitle: "Укажите почту аккаунта. Пришлём на неё ссылку, по которой можно задать новый пароль.",
    remembered: "Вспомнили пароль?",
    submit: "Отправить ссылку",
    busy: "Отправляем…",
    sentTitle: "Проверьте почту",
    sentBefore: "Если аккаунт с адресом",
    sentAfter: "существует, мы отправили на него ссылку для сброса пароля. Она действует 1 час.",
    noEmail: "Письма нет пару минут — загляните в «Спам» или",
    resend: "отправьте ещё раз",
  },
  reset: {
    title: "Новый пароль",
    subtitle: "После сохранения вы выйдете со всех устройств, кроме этого.",
    submit: "Сохранить пароль",
    busy: "Сохраняем…",
    requestNew: "Запросить новую ссылку",
    incompleteTitle: "Ссылка неполная",
    incompleteText: "В ссылке нет кода сброса. Откройте её из письма целиком или запросите новую.",
    expired: "Ссылка устарела или уже использована.",
    done: (email: string) => `Пароль изменён. Вы вошли как ${email}.`,
  },
  account: {
    label: (email: string) => `Аккаунт: ${email}`,
    signedInAs: "Вы вошли как",
    signOut: "Выйти",
    signingOut: "Выходим…",
    unsynced: "Не все изменения успели сохраниться в облаке. Проверьте интернет и попробуйте выйти ещё раз.",
  },
  err: {
    network:
      "Не удалось связаться с сервером. Проверьте подключение к интернету и попробуйте ещё раз. \n Если включён VPN, попробуйте выключить его, это временно, мы уже исправляем.",
    rateLimit: "Слишком много попыток. Подождите до 15 минут и попробуйте снова.",
    emailRejected: "Произошла ошибка. Проверьте, нет ли в адресе эл. почты опечатки или лишних символов.",
    passwordTooLongDot: (n: number) => `Пароль слишком длинный: не больше ${n} символов.`,
    passwordTooLong: (n: number) => `Пароль слишком длинный: не больше ${n} символов`,
    passwordTooShort: (n: number) => `Пароль должен быть не короче ${n} символов`,
    server: "Что-то пошло не так на сервере. Попробуйте ещё раз чуть позже.",
    emailFormat: "Введите почту в формате you@example.com",
  },
  sync: {
    importOffline:
      "Не удалось перенести машины в облако: нет связи с сервером. Они остаются на этом устройстве, попробуем снова при следующем входе.",
    importFailed: "Не удалось перенести машины в облако. Они остаются на этом устройстве.",
    imported: "Машины из этого браузера перенесены в облако.",
    offerTitle: (n: number) => `Добавить ${n === 1 ? "машину" : "машины"} из браузера?`,
    offerLocal: (n: number) =>
      n === 1
        ? "На этом устройстве есть машина, которой нет в облаке."
        : `На этом устройстве есть ${n} ${plural(n, { one: "машина", few: "машины", many: "машин", other: "машины" })}, которых нет в облаке.`,
    offerCloud: (n: number) =>
      `В облаке уже ${n} ${plural(n, { one: "машина", few: "машины", many: "машин", other: "машины" })}. Если добавить, все они будут объединены в одном гараже на любом устройстве.`,
    offerHint: "Если не добавлять, машины из устройства будут скрыты и вернутся сюда после выхода из аккаунта.",
    offerDecline: "Не добавлять",
    offerAccept: "Добавить в облако",
    offerBusy: "Добавляем…",
  },
};

export type AuthMessages = typeof ru;

const en: AuthMessages = {
  toGarage: "To the garage",
  email: "Email",
  password: "Password",
  newPassword: "New password",
  showPassword: "Show password",
  capsLock: "Caps Lock is on",
  passwordHint: (n) => `At least ${n} characters`,
  closeNotice: "Dismiss notice",
  backToLogin: "Back to sign in",
  signIn: "Sign in",

  login: {
    title: "Sign in",
    noAccount: "No account?",
    register: "Create one",
    forgot: "Forgot password?",
    busy: "Signing in…",
    enterPassword: "Enter your password",
    wrong: "Wrong email or password.",
    signedIn: (email) => `Signed in as ${email}.`,
  },
  register: {
    title: "Create account",
    subtitle: "Your garage will be stored in the cloud. Cars from this device will move into it.",
    haveAccount: "Already have an account?",
    submit: "Create account",
    busy: "Creating account…",
    created: (email) => `Account created: ${email}.`,
    taken: "This email is already registered.",
    or: "or",
    restore: "reset your password",
  },
  forgot: {
    title: "Reset password",
    subtitle: "Enter your account email. We'll send a link to set a new password.",
    remembered: "Remembered it?",
    submit: "Send link",
    busy: "Sending…",
    sentTitle: "Check your email",
    sentBefore: "If an account with",
    sentAfter: "exists, we've sent it a password reset link. It's valid for 1 hour.",
    noEmail: "No email after a couple of minutes? Check your spam folder or",
    resend: "send it again",
  },
  reset: {
    title: "New password",
    subtitle: "Once saved, you'll be signed out on all other devices.",
    submit: "Save password",
    busy: "Saving…",
    requestNew: "Request a new link",
    incompleteTitle: "Incomplete link",
    incompleteText: "The link has no reset code. Open the full link from the email or request a new one.",
    expired: "The link has expired or was already used.",
    done: (email) => `Password changed. Signed in as ${email}.`,
  },
  account: {
    label: (email) => `Account: ${email}`,
    signedInAs: "Signed in as",
    signOut: "Sign out",
    signingOut: "Signing out…",
    unsynced: "Not all changes reached the cloud yet. Check your connection and try signing out again.",
  },
  err: {
    network:
      "Couldn't reach the server. Check your internet connection and try again. \n If you use a VPN, try turning it off. This is temporary and we're fixing it.",
    rateLimit: "Too many attempts. Wait up to 15 minutes and try again.",
    emailRejected: "Something went wrong. Check the email address for typos or extra characters.",
    passwordTooLongDot: (n) => `The password is too long: ${n} characters at most.`,
    passwordTooLong: (n) => `The password is too long: ${n} characters at most`,
    passwordTooShort: (n) => `The password must be at least ${n} characters`,
    server: "Something went wrong on the server. Please try again a bit later.",
    emailFormat: "Enter an email like you@example.com",
  },
  sync: {
    importOffline:
      "Couldn't move your cars to the cloud: no connection to the server. They stay on this device; we'll try again next time you sign in.",
    importFailed: "Couldn't move your cars to the cloud. They stay on this device.",
    imported: "Cars from this browser have been moved to the cloud.",
    offerTitle: (n) => `Add ${n === 1 ? "the car" : "the cars"} from this browser?`,
    offerLocal: (n) =>
      n === 1
        ? "This device has a car that isn't in the cloud."
        : `This device has ${n} cars that aren't in the cloud.`,
    offerCloud: (n) =>
      `The cloud already has ${n} ${plural(n, { one: "car", other: "cars" })}. If you add them, they'll all be in one garage on any device.`,
    offerHint: "If you don't, the cars from this device are hidden and come back here after you sign out.",
    offerDecline: "Don't add",
    offerAccept: "Add to cloud",
    offerBusy: "Adding…",
  },
};

export const auth = { ru, en };
