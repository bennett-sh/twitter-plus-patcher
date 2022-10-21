
import { JSDOM } from 'jsdom'
import color from 'cli-color'

// 'release' | 'alpha' | 'beta'
const channel = 'release'
const versionRegExp = new RegExp(`(\\d+)\\.(\\d+)\\.(\\d+)-(release|alpha|beta)\\.(\\d+)`)
const channelRegExp = new RegExp(`(\\d+)\\.(\\d+)\\.(\\d+)-${channel}\\.(\\d+)`)

// Twitter 9.58.0-alpha.5

function sortVersions(a, b) {
  let [_, maj, min, fix, build] = a.match(versionRegExp)
  let [_b, majb, minb, fixb, buildb] = b.match(versionRegExp)

  if(maj > majb) return -1
  if(maj < majb) return 1

  if(min > minb) return -1
  if(min < minb) return 1

  if(fix > fixb) return -1
  if(fix < fixb) return 1

  if(build > buildb) return -1
  if(build < buildb) return 1

  return 0
}

function getUpdateInformation(a, b) {
  let [_, maj, min, fix, build] = a.match(versionRegExp).map(v => parseInt(v))
  let [_b, majb, minb, fixb, buildb] = b.match(versionRegExp).map(v => parseInt(v))

  let isNewest = true
  let diff = null

  if(build > buildb && maj < majb && fix < fixb && min < minb) { isNewest = false; diff = 'build' }
  if(fix > fixb) { isNewest = false; diff = 'fix' }
  if(min > minb && maj < majb) { isNewest = false; diff = 'minor' }
  if(maj > majb) { isNewest = false; diff = 'major' }

  return { isNewest, diff }
}

async function getLatestAppVersion() {
  let response = await fetch('https://apkmirror.com/apk/twitter-inc/twitter/')

  if(response.status < 300 && response.status > 199) {
    let raw = await response.text()
    let page = new JSDOM(raw)

    let document = page.window.document

    let versions = [...document.querySelectorAll("#primary > .listWidget > div:not(.widgetHeader):not(.table)")].map(entry => entry.querySelector('.appRowTitle > a').innerHTML)

    versions = versions.filter(ver => channelRegExp.test(ver))

    versions.sort(sortVersions)

    return versions[0]
  }
}

async function getLatestReleaseVersion() {
  let response = await fetch('https://api.github.com/repos/bennett-sh/twitter-plus-patcher/releases/latest')

  if(response.status < 300 && response.status > 199) {
    let tagName = (await response.json()).tag_name
    
    return tagName.split('-twp.')[0]
  }
}

;(async function() {

  let latestApp = /*await getLatestAppVersion()*/ '8.58.0-alpha.3'
  let latestRelease = await getLatestReleaseVersion()
  let { isNewest, diff } = getUpdateInformation(latestApp, latestRelease)

  if(!isNewest) {
    let clr

    switch(diff) {
      case 'major': clr = color.bold.yellowBright; break
      case 'minor': clr = color.bold.blueBright; break
      case 'fix': clr = color.cyan; break
      case 'build': clr = color.white; break
    }

    console.log(clr(`
      New update available: ${latestRelease} -> ${latestApp} (${diff})
    `.trim()))
  } else {
    console.log(color.green('Up to date.'))
  }

})()
