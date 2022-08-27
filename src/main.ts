
import { exec } from 'child_process'
import patch from './patch.js'
import color from 'cli-color'
import path from 'path'
import 'dotenv/config'
import { readFile, rm } from 'fs/promises'
import { PatchConfig } from './types/PatchConfig.js'

let config: PatchConfig

const isDev = process.env.ENV === 'DEV'
const DECOMPILE_FOLDER = path.resolve(process.env.DECOMPILE_FOLDER)

let apktoolScript = path.join('assets', 'apktool')

function stripExtension(path: string) {
  return path.split('.').slice(0, -1).join('.')
}

async function run(tar: string, args: string | string[] = []) {
  return new Promise((res, rej) => {
    exec(tar + ' ' + (args instanceof Array ? args.join(' ') : args), (err, stdout, stderr) => {
      if(err) {
        console.error(color.redBright(err.message))
        rej(err.message)
      }

      if(stderr) {
        console.error(color.redBright(stderr))
        rej(stderr)
      }

      res(stdout)
    })
  })
}

async function runApkTool(args: string | string[]) {
  return run(apktoolScript, (args instanceof Array ? args.join(' ') : args))
}

async function getApkToolVersion() {
  return new Promise(async (res, rej) => {
    res(await runApkTool('--version'))
  })
}

function printInfo(info: any) {
  for(let [k, v] of Object.entries(info)) {
    console.log(
      color.cyan(k + ': ') + color.yellowBright(v.toString().trim())
    )
  }
}

async function main() {
  if(process.argv.length < 3) {
    console.error(color.redBright(`Usage: ${process.argv.slice(0, 2).join(' ')} <APK>`))
    process.exit(1)
  }
  
  config = JSON.parse(await readFile('config.json', { encoding: 'utf-8' }))

  switch(process.platform) {
    case 'win32':
      apktoolScript = path.join(apktoolScript, 'win.bat')
      break

    case 'darwin':
      apktoolScript = path.join(apktoolScript, 'osx')
      break

    case 'linux':
      apktoolScript = path.join(apktoolScript, 'linux')
      break

    default:
      console.log(color.redBright(`Unsupported OS: ${process.platform}. Only Windows, Linux and MacOS are currently supported.`))
      process.exit(1)
  }


  const apk = path.resolve(process.argv[2])
  const unsignedOutputApk = stripExtension(path.resolve(apk)) + '-unsigned-patched.apk'
  const zipAlignedOutputApk = stripExtension(path.resolve(apk)) + '-zipaligned-patched.apk'
  const outputApk = stripExtension(path.resolve(apk)) + '-patched.apk'


  printInfo({
    OS: process.platform,
    'Node Version': process.version,
    'APKTool Version': 'v' + await getApkToolVersion(),
    'APK': apk,
    'Decompilation Folder': DECOMPILE_FOLDER
  })


  await rm(DECOMPILE_FOLDER, { recursive: true, force: true })


  console.log(color.blueBright(`\nDecompiling '${apk}'...`))
  await runApkTool(['d', apk, '--force', `--output ${DECOMPILE_FOLDER}`, '--no-src'])
  console.log(color.greenBright('Done.'))


  console.log(color.blueBright('Patching apk...'))
  await patch(DECOMPILE_FOLDER, config)
  console.log(color.greenBright('Done.'))


  console.log(color.blueBright('Building apk...'))
  await runApkTool(['b', DECOMPILE_FOLDER, `--output ${unsignedOutputApk}`])
  console.log(color.greenBright('Done.'))

  if(config.keystore !== null) {
    console.log(color.blueBright('Zip aligning apk...'))
    await run('zipalign', ['-f', '-v 4', unsignedOutputApk, zipAlignedOutputApk])
    await rm(unsignedOutputApk)
    console.log(color.greenBright('Done.'))

    console.log(color.blueBright('Signing apk...'))
    await run('apksigner', ['sign', `--ks ${config.keystore.path}`, `--ks-pass pass:"${config.keystore.password}"`, `--key-pass pass:"${config.keystore.password}"`, `--ks-key-alias ${config.keystore.keyAlias}`, `--out ${outputApk}`, zipAlignedOutputApk])
    await rm(zipAlignedOutputApk)
    console.log(color.greenBright('Done.'))
  } else {
    console.warn(color.yellowBright('WARNING: No keystore specified. APK wasn\'t signed.'))
  }


  if(!isDev) {
    console.log(color.blueBright('Cleaning...'))

    await rm(DECOMPILE_FOLDER, { force: true, recursive: true })
    console.log(color.greenBright('Done.'))
  }

  /* FIXME: "All files should be loaded" if(process.argv.map(arg => arg.trim()).includes('--install')) {
    console.log(color.blueBright('Installing...'))

    await run('adb', ['install', outputApk])
    console.log(color.greenBright('Done.'))
  } */
}

main()
