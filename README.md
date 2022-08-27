# Twitter Plus Patcher
### This program patches multiple modifications (like Material You or Android 13 dynamic icons) into a Twitter APK
<br/>

## ***DISCLAIMER: This project is NOT made by/associated with Twitter Inc.***

<br />

## Requirements
- JDK (must be in path)
- Android Build Tools (must be in path)
- Node/NPM
- [A keystore](#creating-a-keystore)
- A Twitter APK file (can be download from [here](https://apkmirror.com/apk/twitter-inc/twitter))

## Installation
1. Clone this repo
2. Run ```npm i&tsc```

## Usage
1. Configure the patch in config.json
2. Run ```node . <Path to Twitter APK>```

## Config
| Name               	| Description                                                                                                                        	| Type                                                                  	|
|--------------------	|------------------------------------------------------------------------------------------------------------------------------------	|-----------------------------------------------------------------------	|
| appName            	| The name of the app                                                                                                                	| string                                                                	|
| appVersion         	| The app version                                                                                                                   	| Object(name?: string; code?: string)                                   	|
| appIcon            	| An object containing info about the app icon (if a property is not set, it won't override the icon)                                	| Object(foreground?: string, background?: string, monochrome?: string) 	|
| packageName        	| The name of the app package                                                                                                        	| string                                                                	|
| materialYou        	| Whether or not the app should use Material You colors                                                                              	| boolean                                                               	|
| removeTranslations 	| Whether or not translations should be removed (if translations are kept, some patches may not work in some languages)              	| boolean                                                               	|
| keystore           	| An object containing information about a keystore                                                                                  	| Object(path: string, password: string, keyAlias: string)              	|
| patches            	| A list of custom patches. Each patch must be a folder inside /patches. Each patch will be copied into the decompiled apk directory 	| Array<String>                                                         	|

## Creating a keystore
Run ```keytool -genkeypair -v -keystore keystore.jks -alias twitterplus -keyalg RSA -sigalg SHA256withRSA -keysize 2048 -validity 10000```
  - Follow all prompts
  - The created keystore will be valid for 10000 days
  - The password should only contain a limited set of characters which don't interfer with the terminal (e.g. no space or no and-symbol)

! Make sure to add the password to config.json !
