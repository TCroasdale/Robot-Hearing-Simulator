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
      }
    });
  })

  var save_robot = function (data) {
    if(data.success == "true"){
      var config = editor.getValue()
      jsConfig = JSON.parse(config)
      // jsConfig.simulation_config.source_config.input_utterance.uid = data.sound_ids.utterance_id

      $.post('/designer/save', {config: JSON.stringify(jsConfig), robot_name: $('#robot-name').val()}, function(data){
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
        success: save_robot,
        cache: false,
        contentType: false,
        processData: false
    });
});

  $('#save-robot').click(function(){
    $('#uploadpopup').modal({backdrop: 'static', keyboard: false})
    var i = $('#utterance-select')[0].selectedIndex
    if(i == 0){
      $('#sound-uploads-form').submit()
    }
    else{
      data = JSON.parse('{"success": "true", "sound_ids": {"utterance_id":' + $('#utterance-select')[0][i].value + '}}')
      save_robot(data)
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

  //Creating the UI
  i=0
  $('#add-mic').click(function(){
    create_mic_panel($('#mic-setups'), 'mic-conf', i)
    i += 1
  })
  $('#add-mic').click()
  j=0
  $('#add-mot').click(function(){
    create_mot_panel($('#mot-setups'), 'mot-conf', j)
    j += 1
  })
  $('#add-mot').click()

  create_number_input($('#skin-width'), "Skin Width", 0.25, 0.05)

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

  set_number_input('skin_width', conf['robot_config']['skin_width'])

  var mic_setups = conf['robot_config']["microphones"]
  for(i = 0; i < mic_setups.length; i++){
    if(i >= $('#mic-setups')[0].children.length){
      create_src_panel($('#mic-setups'), 'mic-conf', i)
    }
    set_number_input('mic-conf-id-{0}'.format(i), mic_setups[i]['id'])
    set_vec3_input('mic-conf-pos-{0}'.format(i), mic_setups[i]['local_pos'])
    set_vec3_input('mic-conf-rot-{0}'.format(i), mic_setups[i]['local_rot'])

  }
  var mot_setups = conf['robot_config']["motors"]
  for(i = 0; i < mot_setups.length; i++){
    if(i >= $('#mot-setups')[0].children.length){
      create_src_panel($('#mot-setups'), 'mot-conf', i)
    }
    set_number_input('mot-conf-id-{0}'.format(i), mot_setups[i]['id'])
    set_vec3_input('mot-conf-pos-{0}'.format(i), mot_setups[i]['local_pos'])

  }

  //Cleaning up spare panels
  if($('#mic-setups')[0].children.length > mic_setups.length){
    for(i = mic_setups.length; i < $('#mic-setups')[0].children.length; i++){
      console.log("removing: {0}".format('mic-conf-{0}'.format(i)))
      remove_element('mic-conf-{0}'.format(i))
    }
  }
  if($('#mot-setups')[0].children.length > mot_setups.length){
    for(i = mot_setups.length; i < $('#mot-setups')[0].children.length; i++){
      console.log("removing: {0}".format('mot-conf-{0}'.format(i)))
      remove_element('mot-conf-{0}'.format(i))
    }
  }
}

function compile_code(){
  console.log("Compiling robot to code..")
  code = {}
  var skin_width = read_num_input('skin-width')

  num_mics = $('#mic-setups')[0].children.length
  mic_setups = []
  for(i = 0; i < num_mics; i++){
    var id = read_num_input('mic-conf-id-{0}'.format(i))
    var pos = read_vec3_input('mic-conf-pos-{0}'.format(i))
    var rot = read_vec3_input('mic-conf-rot-{0}'.format(i), "RYP")
    //READ MIC STYLE
    mic = {"id": id, "local_pos": pos, "local_rot": rot, "mic_style": {"uid": "-1"}}
    mic_setups.push(mic)
  }
  num_mots = $('#mot-setups')[0].children.length
  mot_setups = []
  for(i = 0; i < num_mots; i++){
    var id = read_num_input('mot-conf-id-{0}'.format(i))
    var pos = read_vec3_input('mot-conf-pos-{0}'.format(i))
    mot = {"id": id, "local_pos": pos, "sound": {"uid": "-1"}}
    //READ SOUND SRC
    mot_setups.push(mot)
  }
  code['robot_config'] = {'skin_width': skin_width, "microphones": mic_setups, "motors": mot_setups}

  return code
}

