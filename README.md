# Aniflect

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/donate?hosted_button_id=6DWVP75DSX6XG)

## Description

Aniflect(animation reflect) can use Kinect v2 to record depth and/or color 
and saves it to disk as recordings then one can bake/convert the recording 
to a grid with depth and/color animated alpha textures with depth shape keys for Blender 2.8

## License

MIT

## Requirements

Windows 10
Blender 2.8 at least
Kinect for Windows v2 sensor with Kinect Adapter for Windows 10 PC(if you wanna record)
[Official Kinect 2 SDK](https://www.microsoft.com/en-us/download/details.aspx?id=44561) installed

## Install precompiled

TODO

## Install for development

You will need node.js v12.x.x with node-gyp installed to be able to compile node.js native addons
I recommend [nvm-windows](https://github.com/coreybutler/nvm-windows) if you need multiple node.js installed
Or just install [node.js-v12.21.0](https://nodejs.org/dist/v12.21.0/node-v12.21.0-x64.msi)
Install [node-gyp](https://www.npmjs.com/package/node-gyp)
Then run on cmd/powershell
```
npm i
```
To install and then run
```
npm run start
```
to startup electron and otionally run
```
npm run build
```
To build a local windows portable executeable

## But why?

Because since 2016~ish I wanted a cheap and more accurate motion capture setup.
AI had many artifacts and cleanups and went nuts when rotating 360deg and rolls and so on.
So I built this so one can frame for frame reflect the animation recorded.

## TODO!?!?

Add workflow/tutorial gifs/videos!
Add icon? Dash silhoutte?
Replace bootstrap with custom style?
Add timed counter before recording
Add pre-compiled Electron build for windows
Add pre-compiled Electron build to github releases
Add auto-update?
Readd support for 2.79?

## Donate

Like this app? Donate some

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/donate?hosted_button_id=6DWVP75DSX6XG)