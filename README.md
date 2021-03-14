# Aniflect

![aniflect baking](https://raw.githubusercontent.com/Jsynk/resources/main/aniflect/aniflect-baking.gif)
![aniflect blender](https://raw.githubusercontent.com/Jsynk/resources/main/aniflect/aniflect-blender.gif)

## Video tutorials

[Quick install and demo youtube](https://youtu.be/8wDGBp-jN-Y)

## Description

Aniflect(animation reflect) can use Kinect v2 to record depth and/or color
and saves it to disk as recordings. Then one can bake/convert the recording 
to a grid with depth and/color animated alpha textures with depth shape keys for Blender 2.8.

## License

MIT

## Requirements

- Windows 10.
- Blender 2.8 at least.
- Kinect for Windows v2 sensor with Kinect Adapter for Windows 10 PC(if you wanna record).
- [Official Kinect 2 SDK](https://www.microsoft.com/en-us/download/details.aspx?id=44561) installed.

## Install precompiled

- Go to [Releases](https://github.com/Jsynk/Aniflect/releases/latest)
- Download Aniflect-Setup-{version}.exe and install

## Install for development

- You will need node.js v12.x.x with node-gyp installed to be able to compile node.js native addons.
- I recommend [nvm-windows](https://github.com/coreybutler/nvm-windows) if you need multiple node.js installed.
- Or just install [node.js-v12.21.0](https://nodejs.org/dist/v12.21.0/node-v12.21.0-x64.msi).
- Install [node-gyp](https://www.npmjs.com/package/node-gyp).
- Then run on cmd/powershell.
```
npm i
```
To install and then run
```
npm run start
```
to startup electron or optionally run
```
npm run build
```
To build a local windows nsis executeable

## But why?

Because since 2016~ish I wanted a cheap and more accurate motion capture setup.
AI had many artifacts and cleanups and went nuts when rotating 360deg and rolling and so on.
So I built this so one can frame for frame reflect the animation recorded.

## TODO!?!?

- Apply auto-update releases
- Update workflow/tutorial gifs/videos!
- Replace bootstrap with custom style?
- Add timed counter before recording?
- Readd support for 2.79?
- Add baking details baked 24 frames in 32s, when finished?
- Add better ui messages rather then draw text on canvas?
- Add messages like on server/client disconnect

## Donate

Like this app? Donate some

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/donate?hosted_button_id=9Q2AVL5T8V8F8)