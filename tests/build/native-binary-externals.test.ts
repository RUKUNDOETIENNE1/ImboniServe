import * as fs from 'fs'
import * as path from 'path'

describe('Webpack externals for native binary packages', () => {
  const nextConfigPath = path.resolve(__dirname, '../../next.config.js')

  it('next.config.js should exist', () => {
    expect(fs.existsSync(nextConfigPath)).toBe(true)
  })

  it('should mark @ffprobe-installer/ffprobe as external', () => {
    const content = fs.readFileSync(nextConfigPath, 'utf8')
    expect(content).toContain('@ffprobe-installer/ffprobe')
    expect(content).toContain('commonjs @ffprobe-installer/ffprobe')
  })

  it('should mark @ffmpeg-installer/ffmpeg as external', () => {
    const content = fs.readFileSync(nextConfigPath, 'utf8')
    expect(content).toContain('@ffmpeg-installer/ffmpeg')
    expect(content).toContain('commonjs @ffmpeg-installer/ffmpeg')
  })

  it('should push externals into config.externals array', () => {
    const content = fs.readFileSync(nextConfigPath, 'utf8')
    expect(content).toContain('config.externals')
    expect(content).toContain('nativeBinaryPackages')
  })
})
