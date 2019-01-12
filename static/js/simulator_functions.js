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

  var run_sim = function (data) {
    if(data.success == "true"){
      var config = editor.getValue()
      jsConfig = JSON.parse(config)
      jsConfig.simulation_config.source_config.input_utterance.uid = data.sound_ids.utterance_id
      var i = $('#robot-select')[0].selectedIndex
      jsConfig.simulation_config.robot_config.uid = $('#robot-select')[0][i].value


      $.post('/simulator/run_simulation', {config: JSON.stringify(jsConfig)}, function(data){
        $('#uploadpopup').modal("hide")
      })
    }else{
      $('#uploadpopup').modal("hide")
    }
  }

  $("#sound-uploads-form").submit(function(e) {
    e.preventDefault();
    var formData = new FormData(this);

    $.ajax({
        url: 'simulator/uploadsounds',
        type: 'POST',
        data: formData,
        success: run_sim,
        cache: false,
        contentType: false,
        processData: false
    });
});

  $('#run_conf').click(function(){
    $('#uploadpopup').modal({backdrop: 'static', keyboard: false})
    var i = $('#utterance-select')[0].selectedIndex
    if(i == 0){
      $('#sound-uploads-form').submit()
    }
    else{
      data = JSON.parse('{"success": "true", "sound_ids": {"utterance_id":' + $('#utterance-select')[0][i].value + '}}')
      run_sim(data)
    }
  })

  $('#utterance-select').change(function(){
    var index = $('#utterance-select')[0].selectedIndex
    console.log(index)
    if(index == 0){
      $("#utterancefile").removeClass("disabled")
    }else{
      $("#utterancefile").addClass("disabled")
    }
  })

  //Creating UI

  i=0
  $('#add-src').click(function(){
    create_src_panel($('#src-setups'), 'src-conf', i)
    i += 1
  })
  $('#add-src').click()

  create_vector3_input($('#robo-pos'), "Position", "POS", 2.5, 0.25,)
  create_vector3_input($('#room-dim'), "Room Dimensions", "DIM", 5.0, 0.25)
  create_number_input($('#rt-60'), 'RT 60', 0.4, 0.1)
  create_number_input($('#sample-rate'), 'Sample Rate', 16000, 100)

  editor.on('change', function(obj){
    update_UI(JSON.parse(editor.getValue()))
  })

  $('#code-tab').click(function(e){
    var newSesh = new EditSession(JSON.stringify(compile_code(), null, " "))
    newSesh.setMode("ace/mode/javascript");
    editor.setSession(newSesh)
  })
})

function update_UI(conf){
  set_vec3_input('robo-pos', conf['simulation_config']['robot_pos'])
  set_vec3_input('room-dim', conf['simulation_config']['room_dimensions'], "WHD")
  set_number_input('rt-60', conf['simulation_config']['rt60'])
  set_number_input('sample-rate', conf['simulation_config']['sample_rate'])

  var sim_setups = conf['simulation_config']['source_config']['simulation_setups']
  for(i = 0; i < sim_setups.length; i++){
    if(i >= $('#src-setups')[0].children.length){
      create_src_panel($('#src-setups'), 'src-conf', i)
    }

    var style = sim_setups[i]['style']
    set_selection_input('src-conf', i, style)
    if(style == "box"){
      set_vec3_input('src-conf-box-dim-{0}'.format(i), sim_setups[i]['dimensions'], "WHD")
      set_vec3_input('src-conf-box-div-{0}'.format(i), sim_setups[i]['divisions'], "WHD")
      set_vec3_input('src-conf-box-pos-{0}'.format(i), sim_setups[i]['origin'])
    }
    else if(style == "pyramid"){
      set_number_input('src-conf-pyr-lays-{0}'.format(i), sim_setups[i]['layers'])
      set_number_input('src-conf-pyr-lays-{0}'.format(i), sim_setups[i]['division'])
      set_number_input('src-conf-pyr-lays-{0}'.format(i), sim_setups[i]['length'])
      set_number_input('src-conf-pyr-lays-{0}'.format(i), sim_setups[i]['angle_from_normal'])
      set_vec3_input('src-conf-pyr-pos-{0}'.format(i), sim_setups[i]['origin'])
    }
    else if(style == "sphere"){
      set_number_input('src-conf-sphere-rings-{0}'.format(i), sim_setups[i]['rings'])
      set_number_input('src-conf-sphere-segs-{0}'.format(i), sim_setups[i]['segments'])
      set_number_input('src-conf-sphere-rad-{0}'.format(i), sim_setups[i]['radius'])
      set_vec3_input('src-conf-sphere-pos-{0}'.format(i), sim_setups[i]['origin'])
    }
    else if(style == "single"){
      set_vec3_input('src-conf-sin-pos-{0}'.format(i), sim_setups[i]['origin'])
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
  console.log("Compiling Code..")
  var robopos = read_vec3_input('robo-pos')
  var roomdim = read_vec3_input('room-dim', "WHD")
  var rt60 = read_num_input('rt-60')
  var sample = read_num_input('sample-rate')
  sim_config = {"robot_pos": robopos, "room_dimensions": roomdim, "rt60": rt60, "sample_rate": sample}

  num_srcs = $('#src-setups')[0].children.length
  sim_setups = []
  for(i = 0; i < num_srcs; i++){
    src_setup = {}
    var style = $('#src-conf-sel-{0}'.format(i))[0].value
    if(style == "box"){
      var dim = read_vec3_input('src-conf-box-dim-{0}'.format(i), "WHD")
      var div = read_vec3_input('src-conf-box-div-{0}'.format(i), "WHD")
      var or = read_vec3_input('src-conf-box-pos-{0}'.format(i))
      src_setup = {"style": style, "origin": or, "dimensions": dim, "divisions": div}
      sim_setups.push(src_setup)
    }
    else if(style == "pyramid"){
      var lay = read_num_input('src-conf-pyr-lays-{0}'.format(i))
      var div = read_num_input('src-conf-pyr-divs-{0}'.format(i))
      var len = read_num_input('src-conf-pyr-len-{0}'.format(i))
      var ang = read_num_input('src-conf-pyr-ang-{0}'.format(i))
      var pos = read_vec3_input('src-conf-pyr-pos-{0}'.format(i))
      src_setup = {"style": style, "origin": pos, "layers": lay, "divisions": div, "angle_from_normal": ang, "length": len}
      sim_setups.push(src_setup)
    }
    else if(style == "sphere"){
      var rin = read_num_input('src-conf-sphere-rings-{0}'.format(i))
      var seg = read_num_input('src-conf-sphere-segs-{0}'.format(i))
      var rad = read_num_input('src-conf-sphere-rad-{0}'.format(i))
      var pos = read_vec3_input('src-conf-sphere-pos-{0}'.format(i))
      src_setup = {"style": style, "origin": pos, "rings": rin, "segments": seg, "radius": rad}
      sim_setups.push(src_setup)
    }
    else if(style == "single"){
      var pos = read_vec3_input('src-conf-sin-pos-{0}'.format(i))
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
