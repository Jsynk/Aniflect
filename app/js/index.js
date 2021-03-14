process.on('uncaughtException', e => {
    debugger
    try {
        fs.writeFileSync(
            'error.log',
            'uncaughtException:\r\n' + e.stack.replace(/\n/g, '\r\n')
        )
    } catch (e) { }
})

var fs = require('fs'),
    path = require('path'),
    jk = require('jsynk');

const { shell, ipcRenderer } = require('electron')
var cwd = process.cwd()
var ud_dir = cwd

ipcRenderer.on('message', function (event, text) {
    var json = text
    try {
        json = JSON.parse(text)
    } catch (err) { }
    console.log(json)
    if(typeof json == 'object' && json != null){
        if(json.type == 'userData'){
            ud_dir = dir = json.path
            make_dir(ud_dir+'/recordings', err => { })
            updateRecordingsFiles()
        }
    }
})

var qs = selector => document.querySelector(selector)
var qsa = selector => document.querySelectorAll(selector)

qs('#open_recordings').addEventListener('click', () => {
    shell.openPath(ud_dir+'\\recordings')
})

qs('#open_selected_recordings').addEventListener('click', () => {
    shell.openPath(dir)
})

qs('#close_window').addEventListener('click', () => {
    window.close()
})

function make_dir(dirpath, cb) {
    fs.stat(dirpath, (err, stats) => {
        if (err && err.errno === -4058) {
            fs.mkdir(dirpath, cb)
        } else {
            cb(err)
        }
    })
}

function get_dir_files(dirpath, cb) {
    fs.readdir(dirpath, (err, content) => {
        if (err) {
            cb([])
        } else {
            cb(content)
        }
    })
}

var depthWidth = 512, depthHeight = 424

var canvas = qs('#canvas')
var canvas2 = qs('#canvas2')
var ctx = canvas.getContext('2d')
var ctx2 = canvas2.getContext('2d')

function clearCanvas(c1, c2) {
    ctx.beginPath()
    ctx.rect(0, 0, depthWidth, depthHeight)
    ctx.fillStyle = 'black'
    ctx.fill()
    if(c1 && c1.message){
        ctx.textAlign = "center"
        ctx.fillStyle = 'red'
        ctx.font = "30px Arial"
        ctx.fillText(c1.message, canvas.width/2, canvas.height/2)
    }

    ctx2.beginPath()
    ctx2.rect(0, 0, depthWidth, depthHeight)
    ctx2.fillStyle = 'black'
    ctx2.fill()
    if(c2 && c2.message){
        ctx2.textAlign = "center"
        ctx2.fillStyle = 'red'
        ctx2.font = "30px Arial"
        ctx2.fillText(c2.message, canvas2.width/2, canvas2.height/2)
    }
}
clearCanvas()

var blank_image = canvas.toDataURL('image/png', 1.0)

var imageData = ctx.createImageData(canvas.width, canvas.height)
var imageDataSize = imageData.data.length
var imageDataArray = imageData.data

var imageData2 = ctx2.createImageData(canvas2.width, canvas2.height)
var imageDataSize2 = imageData2.data.length
var imageDataArray2 = imageData2.data

var dir = ud_dir

function updateRecordingsFiles() {
    get_dir_files(ud_dir+'/recordings', (content) => {
        var options_html = ''
        for (var i = 0; i < content.length; i++) {
            var folder_name = content[i]
            options_html += '<option value="' + folder_name + '">' + folder_name + '</option>'
        }
        qs('#folders_select').innerHTML = options_html
        qs('#folders_select').focus()
    })
}

var bake_frames = []

var folder_name = ''

qs('#bake').addEventListener('click', () => {
    clearCanvas()

    qs('#frames_ui').style.display = "block"
    qs('#bake_folder_ui').style.display = "none"

    folder_name = qs('#folders_select').value
    dir = path.resolve(ud_dir + '/recordings/' + folder_name)

    var depth_files = []
    var depth_color_files = []

    var rec = jk.async_recursive({
        complete: function () {
            var depth_files_len = depth_files.length
            if (depth_files_len != 0) {
                var options_html = ''
                var frame_file_path
                bake_frames = []
                for (var i = 0; i < depth_files_len; i++) {
                    frame_file_path = depth_files[i].toString().replace(/\..*$/, '')
                    bake_frames.push(frame_file_path)
                    options_html += '<option value="' + frame_file_path + '">' + frame_file_path + '</option>'
                }
                qs('#frames_select').innerHTML = options_html
                qs('#frames_select').dispatchEvent(new Event('change'))
                qs('#frames_select').focus()
                qs('#bake_start_select').innerHTML = options_html
                qs('#bake_end_select').innerHTML = options_html
                qs('#bake_end_select').value = frame_file_path
            }
        }
    })

    rec.wait()
    fs.readFile(dir + '/depth/frames.txt', (err, content) => {
        if (!err) {
            depth_files = eval('[' + content + ']')
        }
        rec.done()
    })
    rec.wait()
    fs.readFile(dir + '/depth_color/frames.txt', (err, content) => {
        if (!err) {
            depth_color_files = eval('[' + content + ']')
        }
        rec.done()
    })
})

qsa('.back_to_bake').forEach(el => {
    el.addEventListener('click', () => {
        qs('#bake_folder_ui').style.display = "block"
        qs('#frames_ui').style.display = "none"
        qs('#record_ui').style.display = "none"
        clearCanvas()
    })
})

var image_byte = depthWidth * depthHeight

qs('#frames_select').addEventListener('change', () => {
    var index = qs('#frames_select').selectedIndex
    var depth_byte_position = image_byte * 2 * index

    var kds_buffer = new Buffer(image_byte * 2)
    fs.open(dir + '/depth/stream.kds', 'r', function (err, fd) {
        if (err) return
        fs.read(fd, kds_buffer, 0, kds_buffer.length, depth_byte_position, (err, num, buffer) => {
            if (!err) {
                var pi = 0

                var min_depth = 500
                var max_depth = 4500
                for (var i = 0; i < kds_buffer.length; i += 2) {
                    var depth = (kds_buffer[i + 1] << 8) + kds_buffer[i]

                    if (depth <= min_depth || depth >= max_depth) depth = max_depth

                    var d = 255 - Math.round(depth / max_depth * 255)

                    var px = pi % (depthWidth * 4)
                    var pxo = (pi - px) + (depthWidth * 4 - px)

                    imageDataArray2[pxo - 4] = d
                    imageDataArray2[pxo - 3] = d
                    imageDataArray2[pxo - 2] = d
                    imageDataArray2[pxo - 1] = 0xff

                    pi += 4
                }
                ctx2.putImageData(imageData2, 0, 0)
            }
            else {
                console.log('depth_file_err')
            }
        })
    })
    var depth_color_byte_position = image_byte * 4 * index

    var kdcs_buffer = new Buffer(image_byte * 4)
    fs.open(dir + '/depth_color/stream.kdcs', 'r', function (err, fd) {
        if (err) return
        fs.read(fd, kdcs_buffer, 0, kdcs_buffer.length, depth_color_byte_position, (err, num, a2, a3) => {
            if (!err) {
                for (var i = 0; i < imageDataSize; i += 4) {
                    var px = i % (depthWidth * 4)
                    var pxo = (i - px) + (depthWidth * 4 - px)
                    imageDataArray[pxo - 4] = kdcs_buffer[i - 4]
                    imageDataArray[pxo - 3] = kdcs_buffer[i - 3]
                    imageDataArray[pxo - 2] = kdcs_buffer[i - 2]
                    imageDataArray[pxo - 1] = kdcs_buffer[i - 1]
                }
                ctx.putImageData(imageData, 0, 0)
            }
            else {
                console.log('color_file_err')
            }
        })
    })
})
qs('#bake_start_as_preview').addEventListener('click', () => {
    qs('#bake_start_select').value = qs('#frames_select').value
})
qs('#bake_end_as_preview').addEventListener('click', () => {
    qs('#bake_end_select').value = qs('#frames_select').value
})

var background_depth
var background_depth_file

function update_bg_frame_details() {
    var html = ''
    if (background_depth) {
        html = 'Background frame: ' + background_depth_file || 'Buffer'
    }
    else {
        html = 'Background frame: none'
        background_depth_file = ''
    }
    qs('#bg_frame_label').innerHTML = html
}

update_bg_frame_details()

qs('#bg_frame_as_preview').addEventListener('click', () => {
    // Save selected buffer
    var val = qs('#frames_select').value
    var index = qs('#frames_select').selectedIndex
    var byte_position = image_byte * 2 * index
    var file_path = dir + '/depth/' + val + '.k2d'

    var kds_buffer = new Buffer(image_byte * 2)
    fs.open(dir + '/depth/stream.kds', 'r', function (err, fd) {
        if (err) return
        fs.read(fd, kds_buffer, 0, kds_buffer.length, byte_position, (err, num, buffer) => {
            if (!err) {
                background_depth = kds_buffer
                background_depth_file = file_path
            }
            else {
                background_depth = null
            }
            update_bg_frame_details()
        })
    })
})
qs('#bg_frame_as_none').addEventListener('click', () => {
    background_depth = null
    update_bg_frame_details()
})

var frames = []
var cur_image_index = 0

qs('#init_baking').addEventListener('click', () => {
    clearCanvas({message: 'Baking started'}, {message: 'Baking started'})

    var files_start_frame = 0
    var files_end_frame = bake_frames.length != 0 ? bake_frames.length - 1 : 0

    var sel_start = qs('#bake_start_select').value
    var sel_end = qs('#bake_end_select').value

    for (var i = 0; i < bake_frames.length; i++) {
        var bf = bake_frames[i]
        if (bf == sel_start) {
            files_start_frame = i
        }
        else if (bf == sel_end) {
            files_end_frame = i
            break
        }
    }


    var cur_bake_frames = bake_frames.splice(files_start_frame, files_end_frame - files_start_frame)

    var fms = 1000 / 30
    var start_time = Math.round(parseInt(cur_bake_frames[0]) - fms)
    frames = [{
        time: start_time,
        depth: blank_image,
        depth_color: blank_image,
        start_frame: -1, cur_frame: 0, end_frame: 1,
        start_offset: files_start_frame,
    }]

    for (var i = 0; i < cur_bake_frames.length; i++) {
        var cbf = cur_bake_frames[i]
        var ms = parseInt(cbf)
        var f = {
            time: ms,
            depth: null,
            depth_color: null,
            start_frame: -1, cur_frame: 0, end_frame: 1,
            start_offset: files_start_frame,
        }
        f.cur_frame = Math.round((f.time - start_time) / fms)
        var pf = frames[i]
        if (pf) {
            // f.start_frame = pf.cur_frame
            // pf.end_frame = f.cur_frame
            f.start_frame = pf.cur_frame
            pf.end_frame = f.cur_frame
        }
        else {
            // f.start_frame = f.cur_frame - 1
            f.start_frame = f.cur_frame - 1
        }

        if (i == cur_bake_frames.length - 1) {
            // f.end_frame = f.cur_frame + 1
            f.end_frame = f.cur_frame + 1
        }
        frames.push(f)
    }

    var lf = frames[frames.length - 1]

    frames.push({
        time: start_time,
        depth: blank_image,
        depth_color: blank_image,
        start_frame: lf.cur_frame, cur_frame: lf.cur_frame + 1, end_frame: lf.cur_frame + 2
    })

    frames = frames.slice(0, -1)

    cur_image_index = 0

    make_dir(dir + '/import', () => {
        var rec = jk.async_recursive({
            complete: function () {
                bake_cur_image()
            }
        })

        rec.wait()
        make_dir(dir + '/import/images_color', () => {
            rec.done()
        })

        rec.wait()
        make_dir(dir + '/import/images_alpha', () => {
            rec.done()
        })
    })
})

var left_x = -0.3549255510844336, top_y = -0.35502407938466096, z_pos = -0.5,
    x_diff = Math.abs(left_x) * 2, y_diff = Math.abs(top_y) * 2

var depth_base_pos = { x: left_x, y: top_y, z: z_pos }
var depth_base_diff = { x: x_diff, y: y_diff }

function minify_pos_str(v) {
    var ret_val = v.toFixed(5).replace(/0+$/g, '').replace(/\.$/g, '')
    return ret_val
}

function bake_cur_image() {
    var cur_frame = frames[cur_image_index]
    if (cur_frame) {

        var d_buffer = undefined
        var dc_buffer = undefined

        var rec = jk.async_recursive({
            complete: function () {
                var bake_strs = [start_depth_py_script.replace(/{FOLDER_NAME}/g, folder_name)]

                bake_strs.push('"pos":[')

                var d_buffer_len = d_buffer ? d_buffer.length : depthWidth * depthHeight * 2

                var min_depth = 500
                var max_depth = 4500

                var pi = 0
                var ipi = 0

                var bg_depth_threshold = 100

                function get_depth_info(i, pi) {
                    var depth = d_buffer ? (d_buffer[i + 1] << 8) + d_buffer[i] : max_depth
                    var bg_depth = background_depth ? (background_depth[i + 1] << 8) + background_depth[i] : max_depth

                    if (depth <= min_depth || depth >= max_depth) depth = max_depth
                    if (bg_depth <= min_depth || bg_depth >= max_depth) bg_depth = max_depth

                    var bg_depth_diff = depth - bg_depth

                    if (bg_depth_diff < bg_depth_threshold && bg_depth_diff > -bg_depth_threshold) {
                        depth = max_depth
                    }

                    var d = depth / max_depth * 255

                    var px = pi % depthWidth
                    var py = Math.floor(pi / depthWidth)



                    var u = px / depthWidth
                    var v = py / depthHeight

                    return { depth: depth, d: d, u: u, v: v, px: px, py: py }
                }

                for (var i = 0; i < d_buffer_len; i += 2) {
                    var cur_depth_info = get_depth_info(i, pi)

                    var depth = cur_depth_info.depth
                    var d = cur_depth_info.d
                    var u = cur_depth_info.u
                    var v = cur_depth_info.v
                    var px = cur_depth_info.px
                    var py = cur_depth_info.py

                    if (depth != max_depth && u > 0 && u < 1 && v > 0 && v < 1) {
                        var n_depth_info = get_depth_info(i - (depthWidth * 2), pi - (depthWidth * 4))
                        var s_depth_info = get_depth_info(i - (depthWidth * 2), pi + (depthWidth * 4))

                        var w_depth_info = get_depth_info(i - 2, pi - 4)
                        var e_depth_info = get_depth_info(i + 2, pi + 4)

                        var nw_depth_info = get_depth_info(i - 2 - (depthWidth * 2), pi - 4 - (depthWidth * 4))
                        var ne_depth_info = get_depth_info(i + 2 - (depthWidth * 2), pi + 4 - (depthWidth * 4))

                        var sw_depth_info = get_depth_info(i - 2 + (depthWidth * 2), pi - 4 + (depthWidth * 4))
                        var se_depth_info = get_depth_info(i + 2 + (depthWidth * 2), pi + 4 + (depthWidth * 4))

                        if (
                            n_depth_info.depth == max_depth || s_depth_info.depth == max_depth ||
                            w_depth_info.depth == max_depth || e_depth_info.depth == max_depth ||
                            nw_depth_info.depth == max_depth || ne_depth_info.depth == max_depth ||
                            sw_depth_info.depth == max_depth || se_depth_info.depth == max_depth
                        ) {
                            depth = max_depth
                        }
                    }

                    var pos = depth_base_pos, diff = depth_base_diff

                    var dx = pos.x + ((u / 1.0) * diff.x)
                    var dy = pos.y + ((v / 1.0) * diff.y)
                    // var dpos = { x: dx*-1, y: -pos.z, z: -dy }
                    var dpos = { x: dx, y: pos.z, z: dy }
                    var vpos = { x: dpos.x * d, y: dpos.y * d, z: dpos.z * d }

                    var alpha_bw = depth == max_depth ? 0 : 255


                    var color_r = alpha_bw ? dc_buffer ? dc_buffer[ipi] : d : 0
                    var color_g = alpha_bw ? dc_buffer ? dc_buffer[ipi + 1] : d : 0
                    var color_b = alpha_bw ? dc_buffer ? dc_buffer[ipi + 2] : d : 0
                    var color_a = 0xff

                    var alpha_r = alpha_bw
                    var alpha_g = alpha_bw
                    var alpha_b = alpha_bw
                    var alpha_a = 0xff

                    if (!dc_buffer && alpha_bw != 0) {
                        var checked = (((px + 1) % 2) + (py % 2)) % 2 == 0
                        var dcolor = checked ? 0 : 255
                        color_r = dcolor
                        color_g = dcolor
                        color_b = dcolor
                    }

                    var px2 = ipi % (depthWidth * 4)
                    var pxo = (ipi - px2) + (depthWidth * 4 - px2)

                    // color
                    imageDataArray[pxo - 4] = color_r
                    imageDataArray[pxo - 3] = color_g
                    imageDataArray[pxo - 2] = color_b
                    imageDataArray[pxo - 1] = color_a

                    // alpha
                    imageDataArray2[pxo - 4] = alpha_r
                    imageDataArray2[pxo - 3] = alpha_g
                    imageDataArray2[pxo - 2] = alpha_b
                    imageDataArray2[pxo - 1] = alpha_a

                    if (i != 0) {
                        bake_strs.push(',')
                    }
                    bake_strs.push('[')
                    bake_strs.push(minify_pos_str(vpos.x))
                    bake_strs.push(',')
                    bake_strs.push(minify_pos_str(vpos.y))
                    bake_strs.push(',')
                    bake_strs.push(minify_pos_str(vpos.z))
                    bake_strs.push(']')

                    pi++
                    ipi += 4
                }
                bake_strs.push('],"frames":[')
                bake_strs.push(cur_frame.cur_frame - 1)
                bake_strs.push(',')
                bake_strs.push(cur_frame.cur_frame)
                bake_strs.push(',')
                bake_strs.push(cur_frame.end_frame - 1)
                bake_strs.push(',')
                bake_strs.push(cur_frame.end_frame)
                bake_strs.push(']')

                bake_strs.push(end_depth_py_script)

                var script_data = bake_strs.join('')

                var queue = jk.async_recursive({
                    complete: function () {
                        cur_image_index++
                        bake_cur_image()
                    }
                })

                queue.wait()
                fs.writeFile(dir + '/import/d_' + cur_image_index + '.py', script_data, (err) => {
                    queue.done()
                })

                queue.wait()
                ctx.putImageData(imageData, 0, 0)
                var color_b64 = canvas.toDataURL('image/png').replace(/^.*,/, '')
                var color_buffer = Buffer.from(color_b64, 'base64')

                ctx2.putImageData(imageData2, 0, 0)
                var alpha_b64 = canvas2.toDataURL('image/png').replace(/^.*,/, '')
                var alpha_buffer = Buffer.from(alpha_b64, 'base64')

                for (var i = cur_frame.cur_frame; i < cur_frame.end_frame; i++) {
                    var num_str = '001'
                    var cur_num_str = (i + 1).toString()
                    var path_num_str = num_str.slice(0, 3 - cur_num_str.length) + cur_num_str

                    queue.wait()
                    fs.writeFile(dir + '/import/images_color/frame_' + path_num_str + '.png', color_buffer, (err) => {
                        queue.done()
                    })

                    queue.wait()
                    fs.writeFile(dir + '/import/images_alpha/frame_' + path_num_str + '.png', alpha_buffer, (err) => {
                        queue.done()
                    })
                }
                queue.done()
            }
        })


        var index = cur_image_index + cur_frame.start_offset
        var kds_buffer = new Buffer(image_byte * 2)
        var depth_byte_position = image_byte * 2 * index


        rec.wait()
        fs.open(dir + '/depth/stream.kds', 'r', function (err, fd) {
            if (err) {
                rec.done()
                return
            }
            fs.read(fd, kds_buffer, 0, kds_buffer.length, depth_byte_position, (err, num, a2, a3) => {
                d_buffer = kds_buffer
                rec.done()
            })
        })


        var depth_color_byte_position = image_byte * 4 * index
        var kdcs_buffer = new Buffer(image_byte * 4)
        rec.wait()
        fs.open(dir + '/depth_color/stream.kdcs', 'r', function (err, fd) {
            if (err) {
                rec.done()
                return
            }
            fs.read(fd, kdcs_buffer, 0, kdcs_buffer.length, depth_color_byte_position, (err, num, a2, a3) => {
                dc_buffer = kdcs_buffer
                rec.done()
            })
        })
    }
    else {
        var import_me_script = import_py_script.replace('{END_FRAME}', (frames.length - 1).toString()).replace(/{FOLDER_NAME}/g, folder_name)
        fs.writeFile(dir + '/import/00_IMPORT_ME.py', import_me_script, (err) => {
            if (err) { }
        })

        var movie_duration = frames.length != 0 ? (frames[frames.length - 1].cur_frame + 1).toString() : '10'
        var init_script = init_py_script.replace(/{MOVIE_DURATION}/g, movie_duration).replace(/{FOLDER_NAME}/g, folder_name)
        fs.writeFile(dir + '/import/01_init_import.py', init_script, (err) => {
            if (err) { }
        })

        var end_script = end_py_script
        fs.writeFile(dir + '/import/02_end_import.py', end_script, (err) => {
            if (err) { }
        })

        fs.writeFile(dir + '/import/00_IMPORT_ME.blend', files['00_IMPORT_ME.blend'], (err)=>{
            if (err) { }
        })

        clearCanvas({message: 'Baking complete'}, {message: 'Baking complete'})
    }
}

var import_py_script = [
    'import bpy\r\n',
    'from os import listdir\r\n',
    'def compile_script(file_path):\r\n',
    '\texec(compile(open(file_path).read(), file_path, "exec"))\r\n',

    'rel_path = bpy.path.abspath("//")\r\n',
    'init_filename = rel_path + "01_init_import.py"\r\n',
    'compile_script(init_filename)\r\n',

    'files = listdir(rel_path)',
    'for file in files:',
    '\tif file[:2] == "d_":\r\n',
    '\t\tcompile_script(file)\r\n',

    'end_filename = rel_path + "02_end_import.py"\r\n',
    'compile_script(end_filename)',
].join('')

var init_py_script = [
    'import bpy\r\n',
    'ob_name = "{FOLDER_NAME}_grid"\r\n',
    'ob = bpy.data.objects.get(ob_name)\r\n',
    'if ob is None:\r\n',
    '\tbpy.ops.mesh.primitive_grid_add(x_subdivisions=512, y_subdivisions=424, size=200, calc_uvs=True, enter_editmode=False, align="WORLD", location=(0, 0, 0), scale=(1, 1, 1))\r\n',
    '\tob = bpy.context.object\r\n',
    'ob.name = ob_name\r\n',

    'ob.rotation_euler[1] = 3.14159\r\n',
    'bpy.ops.object.mode_set(mode="EDIT", toggle=False)\r\n',
    'cur_ui_type = bpy.context.area.ui_type\r\n',
    'bpy.context.area.ui_type = "UV"\r\n',
    'bpy.ops.uv.select_all(action="SELECT")\r\n',
    'bpy.context.space_data.pivot_point = "MEDIAN"\r\n',
    'bpy.ops.transform.rotate(value=3.14159, orient_axis="Z", orient_type="VIEW", orient_matrix=((1, 0, 0), (0, 1, 0), (0, 0, 1)), orient_matrix_type="VIEW", mirror=True, use_proportional_edit=False, proportional_edit_falloff="SMOOTH", proportional_size=1, use_proportional_connected=False, use_proportional_projected=False)\r\n',
    'bpy.context.area.ui_type = cur_ui_type\r\n',
    'bpy.ops.object.mode_set(mode="OBJECT", toggle=False)\r\n',
    'ob.scale[0] = -1\r\n',
    'bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)\r\n',
    'bpy.ops.object.shade_smooth()\r\n',

    'rel_path = bpy.path.abspath("//")\r\n',
    'mat = bpy.data.materials.new(name="{FOLDER_NAME}_mat")\r\n',
    'mat.use_nodes = True\r\n',
    'mat.blend_method = "CLIP"\r\n',
    'bsdf = mat.node_tree.nodes["Principled BSDF"]\r\n',

    'texImage = mat.node_tree.nodes.new("ShaderNodeTexImage")\r\n',
    'texImage.image = bpy.data.images.load(rel_path + "images_color/frame_001.png")\r\n',
    'texImage.image.source = "SEQUENCE"\r\n',
    'texImage.image_user.use_auto_refresh = True\r\n',
    'texImage.image_user.frame_duration = {MOVIE_DURATION}\r\n',
    'texImage.image_user.frame_offset = 1\r\n',
    'bsdf.inputs["Base Color"].default_value = (0, 0, 0, 1)\r\n',
    'bsdf.inputs["Specular"].default_value = 0\r\n',
    'mat.node_tree.links.new(bsdf.inputs["Emission"], texImage.outputs["Color"])\r\n',

    'texImage2 = mat.node_tree.nodes.new("ShaderNodeTexImage")\r\n',
    'texImage2.image = bpy.data.images.load(rel_path + "images_alpha/frame_001.png")\r\n',
    'texImage2.image.source = "SEQUENCE"\r\n',
    'texImage2.image_user.use_auto_refresh = True\r\n',
    'texImage2.image_user.frame_duration = {MOVIE_DURATION}\r\n',
    'texImage2.image_user.frame_offset = 1\r\n',
    'mat.node_tree.links.new(bsdf.inputs["Alpha"], texImage2.outputs["Color"])\r\n',

    'ob.data.materials.append(mat)'
].join('')

var end_py_script = [
    'import bpy\r\n',
    'bpy.context.object.rotation_euler[1] = 3.14159\r\n',
    'bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)',
].join('')

var start_depth_py_script = [
    'import bpy\r\n',
    'ob_name = "{FOLDER_NAME}_grid"\r\n',
    'ob = bpy.data.objects.get(ob_name)\r\n',
    'frame = {\r\n',
].join('')
var end_depth_py_script = [
    '}\r\n\r\n',
    'sk = ob.shape_key_add(from_mix=False)\r\n',
    'sk.name = ob.name\r\n',
    'vert_loop = 0\r\n',
    'for vert in ob.data.vertices:\r\n',
    '\tframe_pos = frame["pos"][vert_loop]\r\n',
    '\tvert.co[0] = frame_pos[0]\r\n',
    '\tvert.co[1] = frame_pos[1]\r\n',
    '\tvert.co[2] = frame_pos[2]\r\n',
    '\tsk.data[vert.index].co = vert.co\r\n',
    '\tvert_loop = vert_loop + 1\r\n',
    'sk.value = 0\r\n',
    'sk.keyframe_insert("value",frame=frame["frames"][0])\r\n',
    'sk.value = 1\r\n',
    'sk.keyframe_insert("value",frame=frame["frames"][1])\r\n',
    'sk.value = 1\r\n',
    'sk.keyframe_insert("value",frame=frame["frames"][2])\r\n',
    'sk.value = 0\r\n',
    'sk.keyframe_insert("value",frame=frame["frames"][3])',
].join('')


// Record

var Kinect2 = null
var kinect = null

var s = new jk.sub()
s.set({ p: '', v: {} })

var depth_stream, depth_stream_frames, depth_color_stream, depth_color_stream_frames
var depth_color_opened = false
s.on({
    p: 'cam', f: e => {
        var cam = s.get('cam')
        if (cam == 'open') {
            var rec_folder = qs('#record_folder_name').value || new Date().getTime()
            qs('#record_folder_name').value = ''
            var dir_path = ud_dir + '/recordings/' + rec_folder

            var record_color = depth_color_opened = qs('#record_color').checked

            var recurser = jk.async_recursive({
                complete: () => {
                    if (!Kinect2) {
                        Kinect2 = require('kinect2')
                        kinect = new Kinect2()
                    }
                    if (kinect.open()) {
                        kinect.on('multiSourceFrame', frame => {
                            if (rec_folder) {
                                var time = new Date().getTime()

                                var depth_buffer = frame.rawDepth.buffer
                                depth_stream.write(depth_buffer)
                                depth_stream_frames.write(time.toString() + ',')

                                if (record_color) {
                                    var depth_color_buffer = frame.depthColor.buffer
                                    depth_color_stream.write(depth_color_buffer)
                                    depth_color_stream_frames.write(time.toString() + ',')
                                }
                            }
                        })

                        var frameTypes = record_color ? Kinect2.FrameType.rawDepth | Kinect2.FrameType.depthColor : Kinect2.FrameType.rawDepth
                        kinect.openMultiSourceReader({
                            frameTypes: frameTypes
                        })

                        s.set({ p: 'cam', v: 'opened' })
                        clearCanvas({message: 'Recording'}, {message: 'Recording'})
                    }
                }
            })

            recurser.wait()
            fs.mkdir(dir_path, (err) => {
                if (!err) {
                    recurser.wait()
                    fs.mkdir(dir_path + '/depth', (err) => {
                        depth_stream = fs.createWriteStream(dir_path + '/depth/stream.kds')
                        depth_stream_frames = fs.createWriteStream(dir_path + '/depth/frames.txt')
                        recurser.done()
                    })
                    if (record_color) {
                        recurser.wait()
                        fs.mkdir(dir_path + '/depth_color', (err) => {
                            depth_color_stream = fs.createWriteStream(dir_path + '/depth_color/stream.kdcs')
                            depth_color_stream_frames = fs.createWriteStream(dir_path + '/depth_color/frames.txt')
                            recurser.done()
                        })
                    }
                    updateRecordingsFiles()
                }
                recurser.done()
            })
        } else if (cam == 'close') {
            kinect.close()
            depth_stream.close()
            depth_stream_frames.close()
            if (depth_color_opened) {
                depth_color_stream.close()
                depth_color_stream_frames.close()
            }
            s.set({ p: 'cam', v: 'closed' })
            clearCanvas({message: 'Recording stopped'}, {message: 'Recording stopped'})
        }
    }
})

qs('#record').addEventListener('click', () => {
    qs('#bake_folder_ui').style.display = 'none'
    qs('#record_ui').style.display = 'block'
    clearCanvas()
})
qs('#init_recording').addEventListener('click', () => {
    var state = { p: 'cam', v: 'open' }
    s.set(state)
    sendWsMessage({ action: 'setState', state: state })
})
qs('#stop_recording').addEventListener('click', () => {
    var state = { p: 'cam', v: 'close' }
    s.set(state)
    sendWsMessage({ action: 'setState', state: state })
})
qs('#record_folder_name').addEventListener('input', (e) => {
    var state = { p: 'folder_name', v: qs('#record_folder_name').value }
    s.set(state)
    sendWsMessage({ action: 'setState', state: state})
})
s.on({p:'folder_name', f: (e)=>{
    var val = s.get(e.paths[0])
    if (qs('#record_folder_name').value != val)
        qs('#record_folder_name').value = val
}})

const { networkInterfaces } = require('os')
const nets = networkInterfaces()
let localIpAddress = 'localhost'
for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
            localIpAddress = net.address
        }
    }
}
qs('#connect_ipaddress').value = 'ws://' + localIpAddress + ':8080'

let WebSocket = null
let wss = null
let ws = null
qs('#start_server').addEventListener('click', () => {
    s.set({ p: 'connect', v: 'server' })
})
qs('#connect_to_server').addEventListener('click', () => {
    s.set({ p: 'connect', v: 'client' })
})
s.on({
    p: 'connect', f: e => {
        const connect = s.get('connect')
        if (!WebSocket) {
            WebSocket = require('ws')
        }
        if (connect == 'server') {
            if (!wss) {
                wss = new WebSocket.Server({ port: 8080 })
                wss.on('connection', ws => {
                    ws.on('message', handleWsMessage)
                    clearCanvas({message: `Client connected`})
                })
                clearCanvas({message: `Server started`}, {message:`at ws://${localIpAddress}:8080`})
            }
        } else if (connect == 'client') {
            if (!ws) {
                ws = new WebSocket(qs('#connect_ipaddress').value)
                clearCanvas({message: `Client started`}, {message:`at ${qs('#connect_ipaddress').value}`})
            }
            ws.on('message', handleWsMessage)
        }
    }
})

const sendWsMessage = message => {
    message = JSON.stringify(message)
    const connect = s.get('connect')
    if (connect == 'server') {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message)
            }
        })
    } else if (connect == 'client') {
        ws.send(message)
    }
}

const handleWsMessage = data => {
    data = JSON.parse(data)
    if (data.action == 'setState') {
        s.set(data.state)
    }
}
