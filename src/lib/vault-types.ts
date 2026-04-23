export type VaultCategory = "password" | "note" | "card" | "totp";

export interface PasswordHistoryEntry {
  password: string;
  changedAt: number;
}

export interface VaultItem {
  id: string;
  category: VaultCategory;
  title: string;
  username?: string;
  password?: string;
  url?: string;
  totp?: string;
  notes?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardHolder?: string;
  emoji: string;
  bgColor: string;
  customIconUrl?: string;
  createdAt: number;
  passwordHistory?: PasswordHistoryEntry[];
}

export const categoryLabels: Record<VaultCategory, string> = {
  password: "Passwords",
  note: "Secure notes",
  card: "Credit cards",
  totp: "Authenticator",
};

export const categoryEmojis: Record<VaultCategory, string> = {
  password: "🌐",
  note: "📝",
  card: "💳",
  totp: "🛡️",
};

export const categoryColors: Record<VaultCategory, string> = {
  password: "#fde8e4",
  note: "#fdf3d8",
  card: "#e8f4fd",
  totp: "#eeedfe",
};

export function assessStrength(pw: string): "weak" | "medium" | "strong" {
  if (!pw) return "weak";
  let score = 0;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score >= 4) return "strong";
  if (score >= 2) return "medium";
  return "weak";
}

export function generateTOTP(seed: string): string {
  const window = Math.floor(Date.now() / 30000);
  let h = 0;
  const s = seed + window;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const code = (h % 1000000).toString().padStart(6, "0");
  return code.slice(0, 3) + " " + code.slice(3);
}

// ---------- Advanced password generator ----------

export interface GeneratorOptions {
  length: number; // 20..126
  symbols: number; // count of symbol chars
  numbers: number; // count of digit chars
  words: number; // count of capitalized words injected
}

const LETTERS = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?/~";
const WORDLIST = [
  "Apple", "River", "Stone", "Cloud", "Forest", "Ember", "Glow", "Harbor",
  "Ivory", "Jade", "Kite", "Lunar", "Maple", "Nest", "Orbit", "Pine",
  "Quill", "Raven", "Sage", "Tide", "Umber", "Vivid", "Willow", "Yarrow",
  "Zephyr", "Brook", "Coral", "Dune", "Fern", "Grove",
];

function randInt(max: number): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
}

function pick(s: string): string {
  return s[randInt(s.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generatePassword(opts: GeneratorOptions): string {
  const length = Math.max(20, Math.min(126, Math.floor(opts.length)));
  const tokens: string[] = [];

  // Inject whole words first
  for (let i = 0; i < opts.words; i++) {
    tokens.push(WORDLIST[randInt(WORDLIST.length)]);
  }
  // Inject digits
  for (let i = 0; i < opts.numbers; i++) tokens.push(pick(DIGITS));
  // Inject symbols
  for (let i = 0; i < opts.symbols; i++) tokens.push(pick(SYMBOLS));

  let current = tokens.join("");
  // Fill / trim to exact length using letters
  if (current.length < length) {
    const remaining = length - current.length;
    let filler = "";
    for (let i = 0; i < remaining; i++) filler += pick(LETTERS);
    // Shuffle char-level mix between fill letters and existing token block
    const combined = shuffle((current + filler).split("")).join("");
    current = combined;
  } else if (current.length > length) {
    // Too many tokens — just truncate randomly shuffled chars (best effort)
    current = shuffle(current.split("")).join("").slice(0, length);
  } else {
    current = shuffle(current.split("")).join("");
  }
  return current;
}
