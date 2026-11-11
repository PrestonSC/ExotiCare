import QRCode from 'qrcode'

/** Full URL a QR code should open for an animal's public page. */
export function animalUrl(token: string) {
  return `${location.origin}${import.meta.env.BASE_URL}#/a/${token}`
}

export function qrDataUrl(text: string) {
  return QRCode.toDataURL(text, { errorCorrectionLevel: 'M', margin: 2, width: 320 })
}
