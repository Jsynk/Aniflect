const builder = require('electron-builder')
const Platform = builder.Platform

builder.build({
    targets: Platform.WINDOWS.createTarget(),
    config: {
        appId: 'com.electron.Aniflect',
        productName: 'Aniflect',
        copyright: 'Copyright (c) 2021 Jorge Andrés Guerra Guerra <jsynkk@gmail.com>',
        directories: {
            buildResources: 'build',
            output: 'dist',
            app: '.'
        },
        win: {
            target: 'NSIS',
            // icon: 'build/icon.ico'
        },
        // publish: [{
        //     provider: "github",
        //     owner: "Jsynk",
        //     repo: "Aniflect"
        // }],
        nodeVersion: '12.18.3',
        electronVersion: '11.3.0'
    }
}).then(() => {
    console.log('Build Success')
}).catch((error) => {
    console.log('Build Error')
    console.log(error)
})