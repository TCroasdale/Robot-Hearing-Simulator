function fetchEditorState(link=false){
  if(ace.edit("editor").getValue() === ""){
    // Return a default config if editor is empty
    return {
      "variables": {},
      "simulation_config": {
       "robot_pos": { "x": 0, "y": -1, "z": 0 },
       "room_dimensions": { "x": 5,"y": 5,"z": 5 },
       "abs_coeff": { "Ax1": 0.6, "Ax2": 0.6, "Ay1": 0.6, "Ay2": 0.6,"Az1": 0.6, "Az2": 0.6 },
       "source_config": {
         "simulation_setups": [{"style": "single", "origin": { "x": 0.0, "y": 0.0, "z": 0.0 }}],
         "background_noise": { "volume": 1.0 }
        }
      }
    }
  }else{
    editorText = ace.edit("editor").getValue()
    editorState = JSON.parse(editorText)
    if(link)
      editorState = linkVars(editorState)
    return editorState
  }
}

function updateRobotView(data){
    console.log(data)
    if (data.success){
      config = data.robot
      robot.scale.x = Number(config['robot_config']['dimensions']['x'])
      robot.scale.y = Number(config['robot_config']['dimensions']['y'])
      robot.scale.z = Number(config['robot_config']['dimensions']['z'])
    }
}

function linkVars(conf){
  string_conf = JSON.stringify(conf, null, 0)

  $.each(conf.variables, function(i, v){
    // The three accepted variable methods
    string_conf = string_conf.replace(new RegExp('{"value":"{0}"}'.format(i), 'g'), v);
    string_conf = string_conf.replace(new RegExp("{'value':'{0}'}".format(i), 'g'), v);

    string_conf = string_conf.replace(new RegExp('{"val":"{0}"}'.format(i), 'g'), v);
    string_conf = string_conf.replace(new RegExp("{'val':'{0}'}".format(i), 'g'), v);

    string_conf = string_conf.replace(new RegExp('{"var":"{0}"}'.format(i), 'g'), v);
    string_conf = string_conf.replace(new RegExp("{'var':'{0}'}".format(i), 'g'), v);
  })

  return JSON.parse(string_conf)
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
    update3DView(compile_ui())
  })
  $('#{0}-sel'.format(id)).change(function(){
    update3DView(compile_ui())
  })
  $('#{0}-del'.format(id)).click(function(){
    update3DView(compile_ui())
  })

  update3DView(compile_ui())
  $('[data-toggle="tooltip"]').tooltip();
}

$(document).ready(function() {

  $('[data-toggle="tooltip"]').tooltip();
  $('#uploadpopup').modal("hide")

  var editor = ace.edit("editor");
  editor.setTheme("ace/theme/monokai");
  editor.session.setMode("ace/mode/javascript");
  var EditSession = require("ace/edit_session").EditSession;


  create_vector3_input($('#robo-pos'), "Robot Position", "POS", 0, 0.25,)
  create_vector3_input($('#room-dim'), "Room Dimensions", "DIM", 5.0, 0.25)
  // create_number_input($('#rt-60'), 'RT 60', 0.4, 0.1, "", true)
  // create_number_input($('#sample-rate'), 'Sample Rate', 16000, 100, "", true)

  // ===== Setting up 3D Viewer =====
  room = sceneView.createRoom(1, 1, 1, 0xeeeeee, 0x222222)
  robot = sceneView.createBox(1, 1, 1, 0x3f7faa, true, true)
  sources = [[sceneView.createSphere(0.15, 0xff0000, false, true)]]

  sceneView.setZoomLevel(8)

  update_UI(fetchEditorState(true))
  update3DView(fetchEditorState(true))

  $('#3js-container').click(function(){
    objs = sources.flat()

    selected = sceneView.raycastToObjects(objs)

    if(selected !== null && selected !== undefined){
      sceneView.setSelected(selected.object)
      $('#preview-src').removeClass("disabled")
    }else{
      sceneView.setSelected(null)
      $('#preview-src').addClass("disabled")
    }
  })

  $('#robot-select').change(function(){
    id = $(this).children('option:selected').val()
    $.get('/getrobotconfig', {robot: id}, updateRobotView)
  })
  $('#public-robot-id').change(function(){
    id = $(this).val()
    $.get('/getrobotconfig', {robot: id}, updateRobotView)
  })

  id = $('#robot-select').children('option:selected').val()
  $.get('/getrobotconfig', {robot: id}, updateRobotView)



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

  // ===== Preview Button Handler =====
  $('#preview-src').click(function(){
    if($('#preview-src').hasClass('disabled')) return;

    $('#uploadpopup').modal({backdrop: 'static', keyboard: false})


    //Add utterance and bgnoise to formdata
    fData = new FormData();
    uttupload = $('#utterancefile')
    if(!uttupload[0].disabled){
      fData.append('utterance', uttupload[0].files[0])
    }else{
      fData.append('utterance_id', getFileIDSelection('utterance-select', 'public-utt-id'))
    }

    fData.append('robot_id', getFileIDSelection('robot-select', 'public-robot-id'))


    var robopos = read_vec3_input('robo-pos', "POS", { "x": 0, "y": 0, "z": 0 })
    var roomdim = read_vec3_input('room-dim', "DIM", { "x": 5, "y": 5, "z": 5 })
    var rt60 = set_number_input('rt-60', 0.4)

    fData.append('room-size', roomdim)
    fData.append('robo-pos', robopos)
    fData.append('RT-60', rt60)
    fData.append('src-pos', sceneView.getSelectedPosition())
    fData.append('robot_id', $('#robot-select')[0].value)

    //Upload form data
    $.ajax({
      url: 'simulator/preview_sim',
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


  // ===== Run Button Handler =====
  $('#run_conf').click(function(){
    var newSesh = new EditSession(JSON.stringify(compile_ui(), null, " "))
    newSesh.setMode("ace/mode/javascript");
    editor.setSession(newSesh)

    var config = fetchEditorState()
    if(!verify(config)) return;
    $('#uploadpopup').modal({backdrop: 'static', keyboard: false})


    //Add utterance and bgnoise to formdata
    fData = new FormData();
    uttupload = $('#utterancefile')
    if(!uttupload[0].disabled){
      fData.append('utterance', uttupload[0].files[0])
    }else{
      console.log("fileID", getFileIDSelection('utterance-select', 'public-utt-id'))
      fData.append('utterance_id', getFileIDSelection('utterance-select', 'public-utt-id'))
    }

    bgupload = $('#bgnoise')
    if(!bgupload[0].disabled){
      fData.append('bgnoise', bgupload[0].files[0])
    }
    else{
      fData.append('bgnoise_id', getFileIDSelection('bgnoise-select', 'public-bgnoise-id'))
    }

    fData.append('robot_id', getFileIDSelection('robot-select', 'public-robot-id'))

    //THIS MIGHT CAUSE AN ERROR, WAS ORIGINALLY editor.getValue()
    fData.append('config', JSON.stringify(config))

    urlParams = new URLSearchParams(window.location.search)
    if(urlParams.has('sim')){
      fData.append('sim_to_update', urlParams.get('sim'))
    }

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
    var index = Number($('#utterance-select')[0].value)
    console.log(index)
    if(index == -1){
      $("#utterancefile")[0].disabled = false
      $("#utterancefile-lbl").removeClass("disabled")
    }else{
      $("#utterancefile")[0].disabled = true
      $("#utterancefile-lbl").addClass("disabled")
    }
  })


  $('#bgnoise-select').change(function(){
    var index = Number($('#bgnoise-select')[0].value)
    console.log(index)
    if(index == -1){
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



  // $('#add-src').click()
  $('#src-conf-0-del').remove()


  editor.on('change', function(obj){
    try{
      update_UI(fetchEditorState())
      update3DView(fetchEditorState(link=true))
    }
    catch{
      console.log("Invalid json")
    }
  })

  $('input').change(function(){
    update3DView(compile_ui())
  })

  $('#code-tab').click(function(e){
    var newSesh = new EditSession(JSON.stringify(compile_ui(), null, " "))
    newSesh.setMode("ace/mode/javascript");
    editor.setSession(newSesh)
    update3DView(fetchEditorState(link=true))
  })
})

function getFileIDSelection(selectID, publicID){
  console.log($('#' + selectID))
  if($('#' + selectID).val() < 0){
    return $('#' + publicID).val()
  }else{
    return $('#' + selectID).val()
  }
}

function verify(config){
  if(Number(getFileIDSelection('bgnoise-select', 'public-bgnoise-id')) < -1){
    if($('#bgnoise')[0].files.length < 1){
      failVerify("Please select a background noise file.", 'bgnoise-select')
      return false
    }
  }

  if(Number(getFileIDSelection('utterance-select', 'public-utt-id')) <= -1){
    if($('#utterancefile')[0].files.length < 1){
      return failVerify("Please select an utterance sound file.", 'utterance-select')
    }
  }

  room_dim = config['simulation_config']['room_dimensions']
  if(room_dim['x'] <= 0 || room_dim['y'] <= 0 || room_dim['z'] <= 0){
    return failVerify("Invalid room size", 'room-dim')
  }

  if(config['simulation_config']['rt60'] <= 0){
    return failVerify("Invalid RT-60 Value.", 'rt-60')
  }

  if(pointOutsideRoom(config['simulation_config']['robot_pos'], room_dim)){
    return failVerify("Robot positioned outside the room.", 'robot-pos')
  }

  console.log($('#no-robot-link').length > 0)
  if($('#no-robot-link').length > 0){
    return failVerify("There is no robot available to use.", 'no-robot-link')
  }
  return true
}

function pointOutsideRoom(point, roomDim){
  if(point['x'] < -roomDim['x'] / 2 || point['y'] < -roomDim['y'] / 2 || point['z'] < -roomDim['z'] / 2){
    return true
  }
  else if(point['x'] > roomDim['x'] / 2 || point['y'] > roomDim['y'] / 2 || point['z'] > roomDim['z'] / 2){
    return true
  }
  return false
}

function failVerify(message, id){
  alert(message)
  $('#{0}'.format(id)).focus()
  $('html, body').animate({
      scrollTop: ($('#{0}'.format(id)).offset().top)
  },500);
  return false
}

function update_UI(conf){
  console.log("reflecting changes in the ui")

  set_vec3_input('robo-pos', conf['simulation_config']['robot_pos'])
  set_vec3_input('room-dim', conf['simulation_config']['room_dimensions'], "DIM")
  // set_number_input('rt-60', conf['simulation_config']['rt60'])
  // set_number_input('sample-rate', conf['simulation_config']['sample_rate'])
  console.log("conf", conf)
  //
  $('#Ax1').val(conf['simulation_config']['abs_coeff']['Ax1'])
  $('#Ax2').val(conf['simulation_config']['abs_coeff']['Ax2'])
  $('#Ay1').val(conf['simulation_config']['abs_coeff']['Ay1'])
  $('#Ay2').val(conf['simulation_config']['abs_coeff']['Ay2'])
  $('#Az1').val(conf['simulation_config']['abs_coeff']['Az1'])
  $('#Az2').val(conf['simulation_config']['abs_coeff']['Az2'])

  var sim_setups = conf['simulation_config']['source_config']['simulation_setups']
  console.log("sim setups: ", sim_setups)
  for(s = 0; s < sim_setups.length; s++){
    console.log("updating sim setup") //THIS IS PROBABLY BROKEN
    if(s >= $('#src-setups')[0].children.length){
      addSrcPanel()
    }

    console.log("i: ", s)
    var style = sim_setups[s]['style']
    set_selection_input('src-conf', i, style)
    if(style == "box"){
      set_vec3_input('src-conf-{0}-box-dim'.format(s), sim_setups[s]['dimensions'], "DIM")
      set_vec3_input('src-conf-{0}-box-div'.format(s), sim_setups[s]['divisions'], "DIM")
      set_vec3_input('src-conf-{0}-box-pos'.format(s), sim_setups[s]['origin'])
    }
    else if(style == "pyramid"){
      set_number_input('src-conf-{0}-pyramid-lays'.format(s), sim_setups[s]['layers'])
      set_number_input('src-conf-{0}-pyramid-lays'.format(s), sim_setups[s]['division'])
      set_number_input('src-conf-{0}-pyramid-lays'.format(s), sim_setups[s]['length'])
      set_number_input('src-conf-{0}-pyramid-lays'.format(s), sim_setups[s]['angle_from_normal'])
      set_vec3_input('src-conf-{0}-pyramid-pos'.format(s), sim_setups[s]['origin'])
    }
    else if(style == "sphere"){
      set_number_input('src-conf-{0}-sphere-rings'.format(s), sim_setups[s]['rings'])
      set_number_input('src-conf-{0}-sphere-segs'.format(s), sim_setups[s]['segments'])
      set_number_input('src-conf-{0}-sphere-rad'.format(s), sim_setups[s]['radius'])
      set_vec3_input('src-conf-{0}-sphere-pos'.format(s), sim_setups[s]['origin'])
    }
    else if(style == "single"){
      set_vec3_input('src-conf-{0}-single-pos'.format(s), sim_setups[s]['origin'])
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
function compile_ui(){

  old_cfg = fetchEditorState()

  console.log("Compiling Code..")
  var robopos = read_vec3_input('robo-pos', "POS", old_cfg['simulation_config']['robot_pos'])
  var roomdim = read_vec3_input('room-dim', "DIM", old_cfg['simulation_config']['room_dimensions'])
  // var rt60 = read_num_input('rt-60', old_cfg['simulation_config']['rt60'])
  // var sample = read_num_input('sample-rate', old_cfg['simulation_config']['sample_rate'])

  let Ax1 = $('#Ax1').val()
  let Ax2 = $('#Ax2').val()
  let Ay1 = $('#Ay1').val()
  let Ay2 = $('#Ay2').val()
  let Az1 = $('#Az1').val()
  let Az2 = $('#Az2').val()
  let abs_coeff = { "Ax1": Ax1, "Ax2": Ax2, "Ay1": Ay1, "Ay2": Ay2, "Az1": Az1, "Az2": Az2 }

  sim_config = {"robot_pos": robopos, "room_dimensions": roomdim, "abs_coeff": abs_coeff, "sample_rate": "16000"}

  num_srcs = $('#src-setups')[0].children.length
  sim_setups = []
  for(i = 0; i < num_srcs; i++){
    id = $('#src-setups')[0].children[i].id
    src_setup = {}
    var style = $('#{0}-sel'.format(id))[0].value
    old_setup = old_cfg['simulation_config']['source_config']['simulation_setups'][i]
    if(style == "box"){
      if(old_setup === undefined){ old_setup = {
        "origin": { "x": 0, "y": 0, "z": 0 },
       "dimensions": { "x": 1, "y": 1, "z": 1 },
       "divisions": { "x": 2, "y": 2, "z": 2 } }
      }
      var dim = read_vec3_input('{0}-box-dim'.format(id), "DIM", old_setup['dimensions'])
      var div = read_vec3_input('{0}-box-div'.format(id), "DIM", old_setup['divisions'])
      var or = read_vec3_input('{0}-box-pos'.format(id), "POS", old_setup['origin'])
      src_setup = {"style": style, "origin": or, "dimensions": dim, "divisions": div}
      sim_setups.push(src_setup)
    }
    else if(style == "pyramid"){
      if(old_setup === undefined){
        old_setup = { "origin": { "x": 0, "y": 0, "z": 0 }, "layers": 4, "divisions": 3, "angle_from_normal": 30, "length": 8 }
      }
      var lay = read_num_input('{0}-pyramid-lays'.format(id), old_setup['layers'])
      var div = read_num_input('{0}-pyramid-divs'.format(id), old_setup['divisions'])
      var len = read_num_input('{0}-pyramid-len'.format(id), old_setup['length'])
      var ang = read_num_input('{0}-pyramid-ang'.format(id), old_setup['angle_from_normal'])
      var pos = read_vec3_input('{0}-pyramid-pos'.format(id), "POS", old_setup['origin'])
      src_setup = {"style": style, "origin": pos, "layers": lay, "divisions": div, "angle_from_normal": ang, "length": len}
      sim_setups.push(src_setup)
    }
    else if(style == "sphere"){
      if(old_setup === undefined){
        old_setup = { "origin": { "x": 0, "y": 0, "z": 0 }, "rings": 4, "segments": 8, "radius": 4 }
      }
      var rin = read_num_input('{0}-sphere-rings'.format(id), old_setup['rings'])
      var seg = read_num_input('{0}-sphere-segs'.format(id), old_setup['segments'])
      var rad = read_num_input('{0}-sphere-rad'.format(id), old_setup['radius'])
      var pos = read_vec3_input('{0}-sphere-pos'.format(id), "POS", old_setup['origin'])
      src_setup = {"style": style, "origin": pos, "rings": rin, "segments": seg, "radius": rad}
      sim_setups.push(src_setup)
    }
    else if(style == "single"){
      if(old_setup === undefined){
        old_setup = { "origin": { "x": 0, "y": 0, "z": 0 } }
      }
      var pos = read_vec3_input('{0}-single-pos'.format(id), "POS", old_setup['origin'])
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
  code["variables"] = old_cfg['variables']

  return code
}

function update3DView(config){
  console.log("Updating your view.")

  offset = { 'x': 0, 'y': 0, 'z': 0 }

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
      sources[i].push(sceneView.createSphere(0.15, 0xff0000, false, true))
      sources[i][k].position.x = source_pos_arr[k]['x']// + offset['x']
      sources[i][k].position.y = source_pos_arr[k]['y']// + offset['y']
      sources[i][k].position.z = source_pos_arr[k]['z']// + offset['z']
    }
  }
}


function generate_cube_array(setup_options){
  allPositions = []
  dim = [setup_options['dimensions']['x'], setup_options['dimensions']['y'], setup_options['dimensions']['z']]
  midpoint = [setup_options['origin']['x'], setup_options['origin']['y'], setup_options['origin']['z']]

  x_divs = Number(setup_options['divisions']['x'])
  x_space = (dim[0]/(x_divs-1))
  y_divs = Number(setup_options['divisions']['y'])
  y_space = (dim[1]/(y_divs-1))
  z_divs = Number(setup_options['divisions']['z'])
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
  origin = [Number(setup_options['origin']['x']), Number(setup_options['origin']['y']), Number(setup_options['origin']['z'])]
  r = Number(setup_options['radius'])

  //#Top and bottom ring
  top_point = {'x': origin[0],'y':  origin[1]+r,'z':  origin[2]}
  bottom = {'x': origin[0],'y':  origin[1]-r,'z':  origin[2]}
  allPositions.push(top_point)
  allPositions.push(bottom)

  for(var ring = 1; ring < setup_options['rings']-1; ring++){
      for(var seg = 0; seg <= setup_options['segments']; seg++){
          theta = (360/(setup_options['segments'])) * (Math.PI / 180)
          phi = (180/(setup_options['rings']-1)) * (Math.PI / 180)

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
  origin = [Number(setup_options['origin']['x']), Number(setup_options['origin']['y']), Number(setup_options['origin']['z'])]
  theta = Number(setup_options['angle_from_normal']) * (Math.PI / 180)

  divisions = Number(setup_options['divisions'])

  // Top Point
  point = {'x': origin[0], 'y': origin[1], 'z': origin[2]}
  allPositions.push(point)

  for(var layer = 1; layer <= Number(setup['layers']); layer++){
    // Create the corner vertex for eacg layer
    h = (layer)/Number(setup_options['layers']) * Number(setup_options['length'])
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
