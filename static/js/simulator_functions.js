
function fetchEditorState(){
  if(ace.edit("editor").getValue() == ""){
    // Return a default config if editor is empty
    return {
      "simulation_config": {
       "robot_pos": { "x": "2.5", "y": "2.5", "z": "2.5" },
       "room_dimensions": {"x": "5","y": "5","z": "5"},
       "rt60": "0.4","sample_rate": "16000",
       "source_config": {
         "simulation_setups": [{"style": "single", "origin": { "x": "0.0", "y": "0.0", "z": "0.0" }}],
         "background_noise": { "uid": "-1" }, "input_utterance": { "uid": "-1" }
        },
         "robot_config": { "uid": "-1" }
      }
    }
  }else{
    return JSON.parse(ace.edit("editor").getValue())
  }
}

$(document).ready(function() {
  $('#uploadpopup').modal("hide")

  var editor = ace.edit("editor");
  editor.setTheme("ace/theme/monokai");
  editor.session.setMode("ace/mode/javascript");
  var EditSession = require("ace/edit_session").EditSession;


  $('#fileupload').click(function(){
    var fd = new FormData();
    fd.append('file', $('#fileselect')[0].files[0] );
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
      fData.append('utterance', uttupload[0].files[0])
    }else{
      fData.append('utterance_id', $('#utterance-select')[0].value)
    }

    bgupload = $('#bgnoise')
    if(!bgupload[0].disabled){
      fData.append('bgnoise', bgupload[0].files[0])
    }
    else{
      fData.append('bgnoise_id', $('#bgnoise-select')[0].value)
    }

    fData.append('robot_id', $('#robot-select')[0].value)

    compile_code()
    //THIS MIGHT CAUSE AN ERROR, WAS ORIGINALLY editor.getValue()
    var config = JSON.stringify(fetchEditorState())
    fData.append('config', config)

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
  i=0
  $('#add-src').click(function(){
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

    i += 1
  })
  $('#add-src').click()
  $('#src-conf-0-del').remove()

  create_vector3_input($('#robo-pos'), "Position", "POS", 2.5, 0.25,)
  create_vector3_input($('#room-dim'), "Room Dimensions", "DIM", 5.0, 0.25)
  create_number_input($('#rt-60'), 'RT 60', 0.4, 0.1, "", true)
  create_number_input($('#sample-rate'), 'Sample Rate', 16000, 100, "", true)



  editor.on('change', function(obj){
    try{
      update_UI(fetchEditorState())
    }
    catch{
      console.log("invalid json,")
    }
  })

  $('#code-tab').click(function(e){
    var newSesh = new EditSession(JSON.stringify(compile_code(), null, " "))
    newSesh.setMode("ace/mode/javascript");
    editor.setSession(newSesh)
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
    console.log("updating sim setup")
    if(i >= $('#src-setups')[0].children.length){
      create_src_panel($('#src-setups'), 'src-conf', i)
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
      // print(sim_setups[i]['origin'])
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
    src_setup = {}
    var style = $('#src-conf-{0}-sel'.format(i))[0].value
    old_setup = old_cfg['simulation_config']['source_config']['simulation_setups'][i]
    if(style == "box"){
      var dim = read_vec3_input('src-conf-{0}-box-dim'.format(i), "DIM")
      var div = read_vec3_input('src-conf-{0}-box-div'.format(i), "DIM")
      var or = read_vec3_input('src-conf-{0}-box-pos'.format(i), "POS", old_setup['origin'])
      src_setup = {"style": style, "origin": or, "dimensions": dim, "divisions": div}
      sim_setups.push(src_setup)
    }
    else if(style == "pyramid"){
      var lay = read_num_input('src-conf-{0}-pyramid-lays'.format(i))
      var div = read_num_input('src-conf-{0}-pyramid-divs'.format(i))
      var len = read_num_input('src-conf-{0}-pyramid-len'.format(i))
      var ang = read_num_input('src-conf-{0}-pyramid-ang'.format(i))
      var pos = read_vec3_input('src-conf-{0}-pyramid-pos'.format(i), "POS", old_setup['origin'])
      src_setup = {"style": style, "origin": pos, "layers": lay, "divisions": div, "angle_from_normal": ang, "length": len}
      sim_setups.push(src_setup)
    }
    else if(style == "sphere"){
      var rin = read_num_input('src-conf-{0}-sphere-rings'.format(i))
      var seg = read_num_input('src-conf-{0}-sphere-segs'.format(i))
      var rad = read_num_input('src-conf-{0}-sphere-rad'.format(i))
      var pos = read_vec3_input('src-conf-{0}-sphere-pos'.format(i), "POS", old_setup['origin'])
      src_setup = {"style": style, "origin": pos, "rings": rin, "segments": seg, "radius": rad}
      sim_setups.push(src_setup)
    }
    else if(style == "single"){
      var pos = read_vec3_input('src-conf-{0}-single-pos'.format(i), "POS", old_setup['origin'])
      src_setup = {"style": style, "origin": pos}
      sim_setups.push(src_setup)
    }
  }
  sim_config["source_config"] = {"simulation_setups": sim_setups}

  code = {}
  sim_config['robot_config'] = {"uid": "-1"} //Add the robot config field in for later.
  sim_config['source_config']['background_noise'] = {"uid": "-1"}
  sim_config['source_config']['input_utterance'] = {"uid": "-1"}
  //Add the sim_config to the code
  code["simulation_config"] = sim_config

  return code
}
