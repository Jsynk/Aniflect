var fs = require('fs')
var cwd = process.cwd()

fs.readFile(cwd+'/app/00_IMPORT_ME.blend',(err, buffer)=>{
    if (err) console.log(err)
    var blend64 = buffer.toString('base64')
    fs.writeFile(cwd+'/app/00_IMPORT_ME.blend.b64', blend64, (err)=>{
        
    })
})