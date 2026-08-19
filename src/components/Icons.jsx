const S = ({ children, size = 22, ...p }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    {children}
  </svg>
)

export const IconHome = (p) => (
  <S {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
  </S>
)
export const IconBook = (p) => (
  <S {...p}>
    <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v15" />
    <path d="M4 4.5V19a2.5 2.5 0 0 0 2.5 2.5H20" />
    <path d="M8 7h8M8 11h6" />
  </S>
)
export const IconCards = (p) => (
  <S {...p}>
    <rect x="3" y="6" width="13" height="14" rx="2.5" />
    <path d="M8 3h9.5A2.5 2.5 0 0 1 20 5.5V16" />
  </S>
)
export const IconQuiz = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.2a2.6 2.6 0 1 1 3.4 2.5c-.7.25-1 .8-1 1.5v.3" />
    <path d="M12 17h.01" />
  </S>
)
export const IconExam = (p) => (
  <S {...p}>
    <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v5h5" />
    <path d="m8.5 14 2 2 4-4.5" />
  </S>
)
export const IconChart = (p) => (
  <S {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </S>
)
export const IconGame = (p) => (
  <S {...p}>
    <path d="M7 8h10a5 5 0 0 1 5 5v1a4 4 0 0 1-7 2.7L13.4 16h-2.8l-1.6.7A4 4 0 0 1 2 14v-1a5 5 0 0 1 5-5Z" />
    <path d="M7.5 11.5v2M6.5 12.5h2M16 12h.01M18 14h.01" />
  </S>
)
export const IconClose = (p) => (
  <S {...p}>
    <path d="M6 6 18 18M18 6 6 18" />
  </S>
)
export const IconChevron = (p) => (
  <S {...p}>
    <path d="m9 6 6 6-6 6" />
  </S>
)
export const IconBack = (p) => (
  <S {...p}>
    <path d="m15 6-6 6 6 6" />
  </S>
)
export const IconMoon = (p) => (
  <S {...p}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
  </S>
)
export const IconSun = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </S>
)
export const IconBookmark = ({ dolu, ...p }) => (
  <S {...p} fill={dolu ? 'currentColor' : 'none'}>
    <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
  </S>
)
export const IconNote = (p) => (
  <S {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
    <path d="M14 3v5h5M8 13h8M8 17h5" />
  </S>
)
export const IconWrong = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m9 9 6 6M15 9l-6 6" />
  </S>
)
export const IconCheck = (p) => (
  <S {...p}>
    <path d="m4.5 12.5 5 5 10-11" />
  </S>
)
export const IconFlame = (p) => (
  <S {...p}>
    <path d="M12 22c4 0 6.5-2.6 6.5-6 0-4.2-4-5.6-3.2-10C12.8 7 12 9 12 9s-.7-2.6-2.6-4c.4 3.3-3.9 5-3.9 11 0 3.4 2.5 6 6.5 6Z" />
  </S>
)
export const IconTarget = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" />
  </S>
)
export const IconBulb = (p) => (
  <S {...p}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6v.5h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z" />
  </S>
)
export const IconSpeaker = (p) => (
  <S {...p}>
    <path d="M11 5 6.5 9H3v6h3.5L11 19z" />
    <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10" />
  </S>
)
export const IconMusic = (p) => (
  <S {...p}>
    <path d="M9 18V6l10-2v12" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="16.5" cy="16" r="2.5" />
  </S>
)
export const IconSettings = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
  </S>
)
export const IconCalc = (p) => (
  <S {...p}>
    <rect x="4" y="2.5" width="16" height="19" rx="2.5" />
    <path d="M8 6.5h8M8 11h.01M12 11h.01M16 11h.01M8 14.5h.01M12 14.5h.01M16 14.5h.01M8 18h.01M12 18h.01M16 18h.01" />
  </S>
)
export const IconMap = (p) => (
  <S {...p}>
    <path d="m9 3 6 3 5.2-2.1a.5.5 0 0 1 .8.5v14.2l-6 2.4-6-3-5.2 2.1a.5.5 0 0 1-.8-.5V5.4Z" />
    <path d="M9 3v15M15 6v15" />
  </S>
)
export const IconClock = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.2l3.2 2" />
  </S>
)
export const IconRefresh = (p) => (
  <S {...p}>
    <path d="M20 11a8 8 0 1 0-.6 4" />
    <path d="M20 5v6h-6" />
  </S>
)
export const IconSearch = (p) => (
  <S {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </S>
)
export const IconShuffle = (p) => (
  <S {...p}>
    <path d="M16 4h5v5M21 4l-6.5 6.5M16 20h5v-5M21 20l-6.5-6.5M3 4l4.5 4.5M3 20l7-7" />
  </S>
)
export const IconTrophy = (p) => (
  <S {...p}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0Z" />
    <path d="M8 5H5v1.5A3.5 3.5 0 0 0 8.5 10M16 5h3v1.5A3.5 3.5 0 0 1 15.5 10" />
    <path d="M12 13v4M9 21h6M10 17h4l.7 4H9.3Z" />
  </S>
)
export const IconLink = (p) => (
  <S {...p}>
    <path d="M10 13a4.5 4.5 0 0 0 6.4 0l2.6-2.6a4.5 4.5 0 1 0-6.4-6.4L11 5.6" />
    <path d="M14 11a4.5 4.5 0 0 0-6.4 0L5 13.6a4.5 4.5 0 1 0 6.4 6.4l1.6-1.6" />
  </S>
)
export const IconInstall = (p) => (
  <S {...p}>
    <path d="M12 3v11M8 10.5 12 14.5l4-4" />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </S>
)

/** Ders ikonları */
export const DersIkon = ({ ikon, size = 26 }) => {
  const map = {
    turkce: (
      <S size={size}>
        <path d="M5 20 11 4h2l6 16M8 15h8" />
      </S>
    ),
    matematik: (
      <S size={size}>
        <path d="M4 6h7M7.5 2.5v7M4 17h7M4 20.5h7M14 6.5l6 6M20 6.5l-6 6M14 18h6" />
      </S>
    ),
    tarih: (
      <S size={size}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5.4l3.4 2" />
      </S>
    ),
    cografya: (
      <S size={size}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.6 3 2.6 15 0 18-2.6-3-2.6-15 0-18Z" />
      </S>
    ),
    vatandaslik: (
      <S size={size}>
        <path d="M12 3 4 6.5V12c0 4.6 3.3 7.9 8 9 4.7-1.1 8-4.4 8-9V6.5Z" />
        <path d="m9 12 2 2 4-4" />
      </S>
    ),
    guncel: (
      <S size={size}>
        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h11A1.5 1.5 0 0 1 18 5.5V19a1 1 0 0 0 1 1H6a2 2 0 0 1-2-2Z" />
        <path d="M7 8h8M7 11.5h8M7 15h5M18 9h1.5A1.5 1.5 0 0 1 21 10.5V18a2 2 0 0 1-2 2" />
      </S>
    ),
    egitimbilimleri: (
      <S size={size}>
        <path d="m12 4 9 4-9 4-9-4Z" />
        <path d="M6.5 10v4.5c0 1.8 2.5 3 5.5 3s5.5-1.2 5.5-3V10M21 8v6" />
      </S>
    ),
  }
  return map[ikon] || map.tarih
}
