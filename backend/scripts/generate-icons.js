const fs = require('fs')
const path = require('path')

// Create a simple SVG icon
const createIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <g transform="translate(${size * 0.2}, ${size * 0.2})">
    <rect x="0" y="${size * 0.1}" width="${size * 0.6}" height="${size * 0.05}" fill="white" opacity="0.9" rx="${size * 0.025}"/>
    <rect x="0" y="${size * 0.25}" width="${size * 0.4}" height="${size * 0.05}" fill="white" opacity="0.7" rx="${size * 0.025}"/>
    <rect x="0" y="${size * 0.4}" width="${size * 0.5}" height="${size * 0.05}" fill="white" opacity="0.8" rx="${size * 0.025}"/>
    <circle cx="${size * 0.5}" cy="${size * 0.15}" r="${size * 0.03}" fill="white" opacity="0.9"/>
    <circle cx="${size * 0.5}" cy="${size * 0.3}" r="${size * 0.03}" fill="white" opacity="0.7"/>
    <circle cx="${size * 0.5}" cy="${size * 0.45}" r="${size * 0.03}" fill="white" opacity="0.8"/>
  </g>
</svg>
`

// Icon sizes needed for PWA
const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512]

console.log('Generating app icons...')

sizes.forEach(size => {
  const svg = createIcon(size)
  const filename = `icon-${size}.png`
  
  // For now, just create SVG files (you'd need a proper SVG to PNG converter for production)
  fs.writeFileSync(path.join(__dirname, '..', 'public', `icon-${size}.svg`), svg)
  console.log(`Generated icon-${size}.svg`)
})

// Create favicon.ico placeholder
const faviconSvg = createIcon(32)
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.svg'), faviconSvg)

console.log('Icon generation complete!')
console.log('Note: For production, convert SVG files to PNG format using a proper converter.')