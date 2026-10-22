/**
 * Soru metinlerinde altı çizili olması gereken sözcükler « » işaretleri
 * arasında saklanır. Bu bileşen işaretleri kaldırıp sözcüğün altını çizer.
 * İşaret yoksa metni olduğu gibi basar.
 */
export default function Metin({ children }) {
  const metin = children == null ? '' : String(children)
  if (!metin.includes('«')) return metin

  const parcalar = []
  let konum = 0
  let sira = 0
  while (konum < metin.length) {
    const bas = metin.indexOf('«', konum)
    if (bas < 0) {
      parcalar.push(metin.slice(konum))
      break
    }
    const son = metin.indexOf('»', bas + 1)
    if (son < 0) {
      parcalar.push(metin.slice(konum))
      break
    }
    if (bas > konum) parcalar.push(metin.slice(konum, bas))
    parcalar.push(
      <u key={sira++} className="underline underline-offset-2">
        {metin.slice(bas + 1, son)}
      </u>
    )
    konum = son + 1
  }
  return <>{parcalar}</>
}
