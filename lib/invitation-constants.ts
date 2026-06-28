export const BANKS = [
  { id: 'MB', name: 'MBBank' },
  { id: 'VCB', name: 'Vietcombank' },
  { id: 'TCB', name: 'Techcombank' },
  { id: 'ICB', name: 'VietinBank' },
  { id: 'BIDV', name: 'BIDV' },
  { id: 'ACB', name: 'ACB' },
  { id: 'VPB', name: 'VPBank' },
  { id: 'TPB', name: 'TPBank' },
] as const;

export const MUSIC_OPTIONS = [
  { url: '/audio/a thousand years.mp3', label: 'A Thousand Years (Christina Perri)' },
  { url: '/audio/Chăm Em Một Đời.mp3', label: 'Chăm Em Một Đời' },
  { url: '/audio/Em Đồng Ý (I Do).mp3', label: 'Em Đồng Ý (I Do)' },
  { url: '/audio/Marry You.mp3', label: 'Marry You (Bruno Mars)' },
  { url: '/audio/Die With A Smile.mp3', label: 'Die With A Smile' },
  { url: '/audio/In Your Eyes.mp3', label: 'In Your Eyes' },
  { url: '/audio/Lover (First Dance Remix).mp3', label: 'Lover (First Dance Remix)' },
  { url: '/audio/Lễ Đường.mp3', label: 'Lễ Đường' },
  { url: '/audio/Ngày Này, Người Con Gái Này.mp3', label: 'Ngày Này, Người Con Gái Này' },
  { url: '/audio/Ordinary (Wedding Version).mp3', label: 'Ordinary (Wedding Version)' },
  { url: '/audio/Summertime (Imanbek Remix).mp3', label: 'Summertime (Imanbek Remix)' },
  { url: '/audio/The Most Beautiful Bride In The World.mp3', label: 'The Most Beautiful Bride In The World' },
  { url: '/audio/một đời.mp3', label: 'Một Đời' },
  { url: '/audio/50 Năm Về Sau (Nghĩ Đến Ngày Chúng Ta Sẽ Già).mp3', label: '50 Năm Về Sau' },
] as const;

export const PETAL_EFFECTS = [
  { id: 'none', label: 'Không có', emoji: '✕' },
  { id: 'petals', label: 'Cánh hoa', emoji: '✿' },
  { id: 'hearts', label: 'Trái tim', emoji: '❤' },
  { id: 'sparkles', label: 'Sao nhấp nháy', emoji: '✦' },
] as const;

export const TEMPLATES = [
  { id: 'traditional', name: 'Truyền Thống', color: 'bg-[#fdf8f6] border-[#7c1d00] text-[#7c1d00]', emoji: '🏮' },
  { id: 'romantic', name: 'Lãng Mạn', color: 'bg-[#fff0f3] border-[#e11d48] text-[#e11d48]', emoji: '💕' },
  { id: 'modern', name: 'Hiện Đại', color: 'bg-[#faf9fa] border-[#094cb2] text-[#094cb2]', emoji: '✦' },
  { id: 'royal', name: 'Royal Elegance', color: 'bg-[#f8f5ee] border-[#1e2c54] text-[#1e2c54]', emoji: '👑' },
  { id: 'garden', name: 'Garden Romance', color: 'bg-[#f4f6ef] border-[#3f5e43] text-[#3f5e43]', emoji: '🌿' },
  { id: 'indochine', name: 'Indochine', color: 'bg-[#f8f1e7] border-[#a8442a] text-[#a8442a]', emoji: '🪷' },
] as const;
