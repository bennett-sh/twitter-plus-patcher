
import { readFile, writeFile, readdir, cp } from 'fs/promises'
import { PatchConfig } from './types/PatchConfig'
import { existsSync, rmSync } from 'fs'
import color from 'cli-color'
import path from 'path'


const getDirectories = async dir => (await readdir(dir, { withFileTypes: true })).filter(itm => itm.isDirectory()).map(dir => dir.name)

const TRANSLATIONS_REGEX = /-[a-z]{2}(-r[A-Z]{2})?(-|$)/

export default async function patch(dir: string, config: PatchConfig) {

  const log = (...data) => console.log(...data.map(d => color.cyan(d)))

  const res = path.join(dir, 'res')
  const values = path.join(res, 'values')
  const strings = path.join(values, 'strings.xml')
  const apktoolYml = path.join(dir, 'apktool.yml')
  const manifest = path.join(dir, 'AndroidManifest.xml')
  const adaptiveIconDir = path.join(res, 'mipmap-anydpi-v26')
  const materialYouPatch = path.join('assets', 'material-you-patch')

  if(config.removeTranslations) {
    log('Removing translations...')

    ;(await getDirectories(res))
                .filter(dir => TRANSLATIONS_REGEX.test(dir))
                .forEach(dir => rmSync(path.join(res, dir), { force: true, recursive: true }))
  }

  // Modify package name
  if(config.packageName != null) {
    log('Renaming package...')

    let apktoolConf = (await readFile(apktoolYml, { encoding: 'utf-8' }))
      .replace(/renameManifestPackage: null(\n)?/g, `renameManifestPackage: ${config.packageName} \n`)

    await writeFile(apktoolYml, apktoolConf)
  }

  // Modify version
  if(config.appVersion != null) {
    log('Modifying versopms...')

    let apktoolConf = (await readFile(apktoolYml, { encoding: 'utf-8' }))

    if(config.appVersion.code != null) {
      apktoolConf = apktoolConf.replace(/versionCode: null(\n)?/g, `versionCode: ${config.appVersion.code} \n`)
    }

    if(config.appVersion.name != null) {
      apktoolConf = apktoolConf.replace(/versionName: null(\n)?/g, `versionName: ${config.appVersion.name} \n`)
    }

    await writeFile(apktoolYml, apktoolConf)
  }

  // Modify App Name
  if(config.appName != null) {
    log('Renaming app...')

    let stringsFile = (await readFile(strings, { encoding: 'utf-8' }))
      .replace(/<string name="app_name">.*<\/string>/gi, `<string name="app_name">${config.appName}<\/string>`)

    await writeFile(strings, stringsFile)
  }

  // Other patches
  if(config.patches != null) {
    for(let i = 0; i < Object.keys(config.patches).length; i++) {
      log(`Applying patch [${i + 1}/${Object.keys(config.patches).length}]...`)

      let patch = Object.keys(config.patches)[i]
      let patchEnabled = config.patches[i]

      if(!patchEnabled) continue

      await cp(path.join('patches', patch), path.resolve(dir), { recursive: true })
    }
  }

  // Patch icon
  if(config.appIcon != null) {
    log('Applying icons...')

    let icLauncher = await readFile(path.join(adaptiveIconDir, 'ic_launcher_twitter.xml'), { encoding: 'utf-8' })
    let icLauncherRound = await readFile(path.join(adaptiveIconDir, 'ic_launcher_twitter_round.xml'), { encoding: 'utf-8' })

    if(config.appIcon.foreground != null) {
      icLauncher = icLauncher.replace(/<foreground android:drawable="?.*"? \/>/, `<foreground android:drawable="${config.appIcon.foreground}" />`)
      icLauncherRound = icLauncherRound.replace(/<foreground android:drawable="?.*"? \/>/, `<foreground android:drawable="${config.appIcon.foreground}" />`)
    }

    if(config.appIcon.background != null) {
      icLauncherRound = icLauncherRound.replace(/<background android:drawable="?.*"? \/>/, `<background android:drawable="${config.appIcon.background}" />`)
      icLauncher = icLauncher.replace(/<background android:drawable="?.*"? \/>/, `<background android:drawable="${config.appIcon.background}" />`)
    }

    if(config.appIcon.monochrome != null) {
      if(icLauncher.includes('<monochrome ')) {
        icLauncher = icLauncher.replace(/<monochrome android:drawable="?.*"? \/>/, `<monochrome android:drawable="${config.appIcon.monochrome}" />`)
      } else {
        let lines = icLauncher.split('\n')
        
        lines.splice(
          lines.findIndex(line => line.includes('</adaptive-icon>')),
          0, `<monochrome android:drawable="${config.appIcon.monochrome}" />`
        )

        icLauncherRound = lines.join('\n')
        icLauncher = lines.join('\n')
      }
    }

    await writeFile(path.join(adaptiveIconDir, 'ic_launcher_twitter.xml'), icLauncher)
    await writeFile(path.join(adaptiveIconDir, 'ic_launcher_twitter_round.xml'), icLauncherRound)
  }
  
}
