function fetchEditorState(){
  if(ace.edit("editor").getValue() == ""){
    // Return a default config if editor is empty
    return {
      "variables": {},
      "simulation_config": {
       "robot_pos": { "x": 0, "y": -2, "z": 0 },
       "room_dimensions": {"x": 5,"y": 5,"z": 5},
       "rt60": 0.4,"sample_rate": 16000,
       "source_config": {
         "simulation_setups": [{"style": "single", "origin": { "x": 0.0, "y": 0.0, "z": 0.0 }}],
         "background_noise": { "uid": -1 }, "input_utterance": { "uid": -1 }
        },
         "robot_config": { "uid": -1 }
      }
    }
  }else{
    return JSON.parse(ace.edit("editor").getValue())
  }
}

function addSrcPanel(){
  num_children= $('#src-setups')[0].children.length
  child = $('#src-setups')[0].children[num_children-1]
  var i = 0
  if(num_children > 0) i = Number(child.id.match(/\d+/)[0]) + 1
  let id = 'src-conf-{0}'.format(i)

  appendTemplate($('#src-setups'), 'source-block', {'id': id},
  {'sel-change': function(){
    val = $('#{0}-sel option:selected'.format(id))[0].value
    $('#{0}-pyramid'.format(id)).hide()
    $('#{0}-box'.format(id)).hide()
    $('#{0}-sphere'.format(id)).hide()
    $('#{0}-single'.format(id)).hide()

    $('#{0}-{1}'.format(id, val)).show()
  }, 'del-source': function(){
    $('#{0}'.format(id)).remove()
  }})

  // ===== Add Update functions =====
  $('#{0} input'.format(id)).change(function(){
    update3DView(compile_code())
  })
  $('#{0}-sel'.format(id)).change(function(){
    update3DView(compile_code())
  })
  $('#{0}-del'.format(id)).click(function(){
    update3DView(compile_code())
  })

  update3DView(compile_code())
}

$(document).ready(function() {
  $('#uploadpopup').modal("hide")

  var editor = ace.edit("editor");
  editor.setTheme("ace/theme/monokai");
  editor.session.setMode("ace/mode/javascript");
  editor.setOptions({
    maxLines: Infinity
  });
  var EditSession = require("ace/edit_session").EditSession;


  // ===== Setting up 3D Viewer =====
  room = sceneView.createRoom(1, 1, 1, 0xeeeeee, 0x222222)
  robot = sceneView.createSphere(0.5, 0x3f7faa, false)
  sources = [[sceneView.createSphere(0.25, 0xff0000, false)]]


  // ===== Config Upload Handler =====
  $('#fileupload').click(function(){
    var fd = new FormData();
    fd.push('file', $('#fileselect')[0].files[0] );
    $.ajax({
      url: '/upload_config',
      data: fd,
      processData: false,
      contentType: false,
      type: 'POST',
      success: function(data){
        if(data.success == 'true')
          editor.setValue(JSON.stringify(data.config, null, " "))
          update_UI(data.config)
      }
    });
  })



  $('#run_conf').click(function(){
    $('#uploadpopup').modal({backdrop: 'static', keyboard: false})

    //Add utterance and bgnoise to formdata
    fData = new FormData();
    uttupload = $('#utterancefile')
    if(!uttupload[0].disabled){
      fData.push('utterance', uttupload[0].files[0])
    }else{
      fData.push('utterance_id', $('#utterance-select')[0].value)
    }

    bgupload = $('#bgnoise')
    if(!bgupload[0].disabled){
      fData.push('bgnoise', bgupload[0].files[0])
    }
    else{
      fData.push('bgnoise_id', $('#bgnoise-select')[0].value)
    }

    fData.push('robot_id', $('#robot-select')[0].value)

    compile_code()
    //THIS MIGHT CAUSE AN ERROR, WAS ORIGINALLY editor.getValue()
    var config = JSON.stringify(fetchEditorState())
    fData.push('config', config)

    //Upload form data
    $.ajax({
      url: 'simulator/run_simulation',
      type: 'POST',
      data: fData,

      success: function(data){
        console.log(data)
        if(data.success == false){
          console.log(data.reason)
        }
        $('#uploadpopup').modal("hide")
      },
      cache: false,
      contentType: false,
      dataType: 'json',
      enctype: 'multipart/form-data',
      processData: false
    });
  })

  $('#utterance-select').change(function(){
    var index = $('#utterance-select')[0].selectedIndex
    console.log(index)
    if(index == 0){
      $("#utterancefile")[0].disabled = false
      $("#utterancefile-lbl").removeClass("disabled")
    }else{
      $("#utterancefile")[0].disabled = true
      $("#utterancefile-lbl").addClass("disabled")
    }
  })


  $('#bgnoise-select').change(function(){
    var index = $('#bgnoise-select')[0].selectedIndex
    console.log(index)
    if(index == 0){
      $("#bgnoise")[0].disabled = false
      $("#bgnoise-lbl").removeClass("disabled")
    }else{
      $("#bgnoise")[0].disabled = true
      $("#bgnoise-lbl").addClass("disabled")
    }
  })
  $('#utterance-select').change()
  $('#bgnoise-select').change()

  //Creating UI

  $('#add-src').click(function(){
    addSrcPanel()
  })

  create_vector3_input($('#robo-pos'), "Robot Position", "POS", 0, 0.25,)
  create_vector3_input($('#room-dim'), "Room Dimensions", "DIM", 5.0, 0.25)
  create_number_input($('#rt-60'), 'RT 60', 0.4, 0.1, "", true)
  create_number_input($('#sample-rate'), 'Sample Rate', 16000, 100, "", true)


  $('#add-src').click()
  $('#src-conf-0-del').remove()


  editor.on('change', function(obj){
    try{
      update_UI(fetchEditorState())
      update3DView(fetchEditorState())
    }
    catch{
      console.log("invalid json,")
    }
  })

  $('input').change(function(){
    update3DView(compile_code())
  })

  $('#code-tab').click(function(e){
    var newSesh = new EditSession(JSON.stringify(compile_code(), null, " "))
    newSesh.setMode("ace/mode/javascript");
    editor.setSession(newSesh)
    update3DView(fetchEditorState())
  })
})

function update_UI(conf){
  console.log("reflecting changes in the ui")

  set_vec3_input('robo-pos', conf['simulation_config']['robot_pos'])
  set_vec3_input('room-dim', conf['simulation_config']['room_dimensions'], "DIM")
  set_number_input('rt-60', conf['simulation_config']['rt60'])
  set_number_input('sample-rate', conf['simulation_config']['sample_rate'])

  var sim_setups = conf['simulation_config']['source_config']['simulation_setups']
  console.log(sim_setups)
  for(i = 0; i < sim_setups.length; i++){
    console.log("updating sim setup") //THIS IS PROBABLY BROKEN
    if(i >= $('#src-setups')[0].children.length){
      addSrcPanel()
    }

    var style = sim_setups[i]['style']
    set_selection_input('src-conf', i, style)
    if(style == "box"){
      set_vec3_input('src-conf-{0}-box-dim'.format(i), sim_setups[i]['dimensions'], "DIM")
      set_vec3_input('src-conf-{0}-box-div'.format(i), sim_setups[i]['divisions'], "DIM")
      set_vec3_input('src-conf-{0}-box-pos'.format(i), sim_setups[i]['origin'])
    }
    else if(style == "pyramid"){
      set_number_input('src-conf-{0}-pyramid-lays'.format(i), sim_setups[i]['layers'])
      set_number_input('src-conf-{0}-pyramid-lays'.format(i), sim_setups[i]['division'])
      set_number_input('src-conf-{0}-pyramid-lays'.format(i), sim_setups[i]['length'])
      set_number_input('src-conf-{0}-pyramid-lays'.format(i), sim_setups[i]['angle_from_normal'])
      set_vec3_input('src-conf-{0}-pyramid-pos'.format(i), sim_setups[i]['origin'])
    }
    else if(style == "sphere"){
      set_number_input('src-conf-{0}-sphere-rings'.format(i), sim_setups[i]['rings'])
      set_number_input('src-conf-{0}-sphere-segs'.format(i), sim_setups[i]['segments'])
      set_number_input('src-conf-{0}-sphere-rad'.format(i), sim_setups[i]['radius'])
      set_vec3_input('src-conf-{0}-sphere-pos'.format(i), sim_setups[i]['origin'])
    }
    else if(style == "single"){
      set_vec3_input('src-conf-{0}-single-pos'.format(i), sim_setups[i]['origin'])
    }
  }
  if($('#src-setups')[0].children.length > sim_setups.length){
    console.log("mismatched lengths")
    for(i = sim_setups.length; i < $('#src-setups')[0].children.length; i++){
      console.log("removing: {0}".format('src-conf-{0}'.format(i)))
      remove_element('src-conf-{0}'.format(i))
    }
  }
}


// Compiles the code to the correct format and adds objects that should be there.
function compile_code(){

  old_cfg = fetchEditorState()

  console.log("Compiling Code..")
  var robopos = read_vec3_input('robo-pos', "POS", old_cfg['simulation_config']['robot_pos'])
  var roomdim = read_vec3_input('room-dim', "DIM", old_cfg['simulation_config']['room_dimensions'])
  var rt60 = read_num_input('rt-60', old_cfg['simulation_config']['rt60'])
  var sample = read_num_input('sample-rate', old_cfg['simulation_config']['sample_rate'])
  sim_config = {"robot_pos": robopos, "room_dimensions": roomdim, "rt60": rt60, "sample_rate": sample}

  num_srcs = $('#src-setups')[0].children.length
  sim_setups = []
  for(i = 0; i < num_srcs; i++){
    id = $('#src-setups')[0].children[i].id
    src_setup = {}
    var style = $('#{0}-sel'.format(id))[0].value
    old_setup = old_cfg['simulation_config']['source_config']['simulation_setups'][i]
    if(style == "box"){
      var dim = read_vec3_input('{0}-box-dim'.format(id), "DIM")
      var div = read_vec3_input('{0}-box-div'.format(id), "DIM")
      var or = read_vec3_input('{0}-box-pos'.format(id), "POS", old_cfg['origin'])
      src_setup = {"style": style, "origin": or, "dimensions": dim, "divisions": div}
      sim_setups.push(src_setup)
    }
    else if(style == "pyramid"){
      var lay = read_num_input('{0}-pyramid-lays'.format(id))
      var div = read_num_input('{0}-pyramid-divs'.format(id))
      var len = read_num_input('{0}-pyramid-len'.format(id))
      var ang = read_num_input('{0}-pyramid-ang'.format(id))
      var pos = read_vec3_input('{0}-pyramid-pos'.format(id), "POS", old_cfg['origin'])
      src_setup = {"style": style, "origin": pos, "layers": lay, "divisions": div, "angle_from_normal": ang, "length": len}
      sim_setups.push(src_setup)
    }
    else if(style == "sphere"){
      var rin = read_num_input('{0}-sphere-rings'.format(id))
      var seg = read_num_input('{0}-sphere-segs'.format(id))
      var rad = read_num_input('{0}-sphere-rad'.format(id))
      var pos = read_vec3_input('{0}-sphere-pos'.format(id), "POS", old_cfg['origin'])
      src_setup = {"style": style, "origin": pos, "rings": rin, "segments": seg, "radius": rad}
      sim_setups.push(src_setup)
    }
    else if(style == "single"){
      var pos = read_vec3_input('{0}-single-pos'.format(id), "POS", old_cfg['origin'])
      src_setup = {"style": style, "origin": pos}
      sim_setups.push(src_setup)
    }
  }
  sim_config["source_config"] = {"simulation_setups": sim_setups}

  code = {}
  sim_config['robot_config'] = {"uid": -1} //Add the robot config field in for later.
  sim_config['source_config']['background_noise'] = {"uid": -1}
  sim_config['source_config']['input_utterance'] = {"uid": -1}
  //Add the sim_config to the code
  code["simulation_config"] = sim_config

  return code
}

function update3DView(config){
  console.log("Updating your view.")

  offset = { 'x': 0, 'y': 0, 'z': 0 }
  // offset['x'] = config['simulation_config']['room_dimensions']['x'] / 2
  // offset['y'] = config['simulation_config']['room_dimensions']['y'] / 2
  // offset['z'] = config['simulation_config']['room_dimensions']['z'] / 2

  room.scale.x = config['simulation_config']['room_dimensions']['x']
  room.scale.y = config['simulation_config']['room_dimensions']['y']
  room.scale.z = config['simulation_config']['room_dimensions']['z']

  room.position.x = offset['x']
  room.position.y = offset['y']
  room.position.z = offset['z']

  // sceneView.setCameraFocus(offset['x'], offset['y'], offset['z'])

  robot.position.x = config['simulation_config']['robot_pos']['x']// + offset['x']
  robot.position.y = config['simulation_config']['robot_pos']['y']// + offset['y']
  robot.position.z = config['simulation_config']['robot_pos']['z']// + offset['z']

  source_setups = config['simulation_config']['source_config']['simulation_setups']
  // Delete all source spheres, very inefficient method
  for(var i in sources){
    for(var j in sources[i]){
      sceneView.scene.remove(sources[i][j])
    }
  }
  sources = []
  for(var i in source_setups){
    setup = source_setups[i]
    source_pos_arr = []
    if(setup['style'] === "single"){
      source_pos_arr.push({'x':0,'y':0,'z':0})
      source_pos_arr[0]['x'] = setup['origin']['x']
      source_pos_arr[0]['y'] = setup['origin']['y']
      source_pos_arr[0]['z'] = setup['origin']['z']
    }
    else if(setup['style'] === 'box'){
      source_pos_arr = generate_cube_array(setup)
    }
    else if(setup['style'] === 'sphere'){
      source_pos_arr = generate_sphere_array(setup)
    }
    else if(setup['style'] === 'pyramid'){
      source_pos_arr = generate_pyramid_array(setup)
    }
    sources.push([])
    for(var k in source_pos_arr){
      sources[i].push(sceneView.createSphere(0.25, 0xff0000, false, true))
      sources[i][k].position.x = source_pos_arr[k]['x']// + offset['x']
      sources[i][k].position.y = source_pos_arr[k]['y']// + offset['y']
      sources[i][k].position.z = source_pos_arr[k]['z']// + offset['z']
    }
  }
}


function generate_cube_array(setup_options){
  allPositions = []
  dim = [setup['dimensions']['x'], setup['dimensions']['y'], setup['dimensions']['z']]
  midpoint = [setup['origin']['x'], setup['origin']['y'], setup['origin']['z']]

  x_divs = Number(setup['divisions']['x'])
  x_space = (dim[0]/(x_divs-1))
  y_divs = Number(setup['divisions']['y'])
  y_space = (dim[1]/(y_divs-1))
  z_divs = Number(setup['divisions']['z'])
  z_space = (dim[2]/(z_divs-1))
  for(var x = 0; x < x_divs; x++){
      x_pos = midpoint[0] + (x * x_space) - dim[0]/2
      if(x_divs === 1) x_pos = midpoint[0]
      for(var y = 0; y < y_divs; y++){
          y_pos = midpoint[1] + (y * y_space) - dim[1]/2
          if(y_divs === 1) y_pos = midpoint[1]
          for(var z = 0; z < z_divs; z++){
              z_pos = midpoint[2] + (z * z_space) - dim[2]/2
              if(z_divs === 1) z_pos = midpoint[2]
              allPositions.push({'x': x_pos, 'y': y_pos, 'z': z_pos})
          }
      }
  }
  return allPositions
}

function generate_sphere_array(setup_options){
  allPositions = []
  origin = [Number(setup['origin']['x']), Number(setup['origin']['y']), Number(setup['origin']['z'])]
  r = Number(setup['radius'])

  //#Top and bottom ring
  top_point = {'x': origin[0],'y':  origin[1]+r,'z':  origin[2]}
  bottom = {'x': origin[0],'y':  origin[1]-r,'z':  origin[2]}
  allPositions.push(top_point)
  allPositions.push(bottom)

  for(var ring = 1; ring < setup['rings']-1; ring++){
      for(var seg = 0; seg <= setup['segments']; seg++){
          theta = (360/(setup['segments'])) * (Math.PI / 180)
          phi = (180/(setup['rings']-1)) * (Math.PI / 180)

          y = r * Math.cos(phi * ring)
          x = r * Math.sin(theta * seg) * Math.sin(phi * ring)
          z = r * Math.cos(theta * seg) * Math.sin(phi * ring)

          allPositions.push({'x': x+origin[0],'y': y+origin[1],'z':z+origin[2]})
      }
  }
  return allPositions
}

function generate_pyramid_array(setup_options){
  allPositions = []
  origin = [Number(setup['origin']['x']), Number(setup['origin']['y']), Number(setup['origin']['z'])]
  theta = Number(setup['angle_from_normal']) * (Math.PI / 180)

  divisions = Number(setup['divisions'])

  // Top Point
  point = [origin[0], origin[1], origin[2]]
  allPositions.push(point)

  for(var layer = 0; layer < Number(setup['layers']); layer++){
    // Create the corner vertex for eacg layer
    h = layer/Number(setup['layers']) * Number(setup['length'])
    d = h * Math.sin(theta)

    allPositions.push({'x': d+origin[0], 'y': origin[1]-h, 'z': d+origin[2]})
    allPositions.push({'x': d+origin[0], 'y': origin[1]-h, 'z': -d+origin[2]})
    allPositions.push({'x': -d+origin[0], 'y': origin[1]-h, 'z': d+origin[2]})
    allPositions.push({'x': -d+origin[0], 'y': origin[1]-h, 'z': -d+origin[2]})
    for(var div = 0; div < divisions-1; div++){
      // Add each division to each side.
      pos = div / (divisions-1)
      d1 = -d + (pos*d*2)

      allPositions.push({'x': d+origin[0], 'y': origin[1]-h, 'z': d1+origin[2]})
      allPositions.push({'x': -d+origin[0], 'y': origin[1]-h, 'z': d1+origin[2]})
      allPositions.push({'x': d1+origin[0], 'y': origin[1]-h, 'z': d+origin[2]})
      allPositions.push({'x': d1+origin[0], 'y': origin[1]-h, 'z': -d+origin[2]})

    }
  }
  return allPositions
}
