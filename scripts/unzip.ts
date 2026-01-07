import { gunzipSync } from 'zlib'
import { Buffer } from 'buffer'

const compressedHtml = ""

// Decompress and save HTML to file
import { mkdirSync, writeFileSync } from 'fs'

async function decompressAndSave() {
  try {
    // Decompress the gzipped HTML from base64
    const decompressedHtml = gunzipSync(Buffer.from(compressedHtml, 'base64')).toString('utf-8')
    
    // Create test directory if it doesn't exist
    const testDir = './scripts'
    mkdirSync(testDir, { recursive: true })
    
    // Write the HTML to a file
    const outputPath = `${testDir}/valmeinier.html`
    writeFileSync(outputPath, decompressedHtml, 'utf-8')
    
    console.log(`✅ HTML successfully decompressed and saved to: ${outputPath}`)
    console.log(`📊 Decompressed size: ${decompressedHtml.length} bytes`)
  } catch (error) {
    console.error('❌ Error decompressing or saving HTML:', error)
    process.exit(1)
  }
}

// Run the function if this script is executed directly
decompressAndSave()
