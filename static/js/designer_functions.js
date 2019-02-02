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

  $('#save-robot').click(function(){
    $('#uploadpopup').modal({backdrop: 'static', keyboard: false})

    //Find all sounds and add them to the file
    fData = new FormData();
    id_to_sound_map = {} // Map from motor id to i value

    //Needs to exit on invalid sound files
    num_mots = $('#mot-setups')[0].children.length
    for(var i=0; i<num_mots; i++){
      var child = $('#mot-setups')[0].children[i]

      soundupload = $('#{0}-mot-sound'.format(child.id))
      if(!soundupload.disabled){
        fData.append('{0}'.format(i), soundupload[0].files[0])

        var mot_id = read_num_input('{0}-id'.format(child.id))
        id_to_sound_map[mot_id] = i
      }else{
        id_to_sound_map[mot_id] = $('#{0}-sound-select'.format(child.id))[0].value
      }
    }

    fData.append("id_map", JSON.stringify(id_to_sound_map))
    
    compile_code()
    var config = editor.getValue()
    fData.append('robot-config', config)

    fData.append('robot_name', $('#robot-name')[0].value)

    //Upload form data
    $.ajax({
      url: 'designer/save',
      type: 'POST',
      data: fData,
      
      success: function(data){
        console.log(data.success)
      },
      cache: false,
      contentType: false,
      dataType: 'json',
      enctype: 'multipart/form-data',
      processData: false
    });

  })

  $('#-select').change(function(){
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
    let id = 'mic-conf-{0}'.format(i)
    appendTemplate($('#mic-setups'), 'mic-block', {'id': 'mic-conf-{0}'.format(i), 'num': i},
    {'del-mic': function(){
      $('#{0}'.format(id)).remove()
    }})

    i += 1
  })
  $('#add-mic').click()
  $('#mic-conf-0-del').remove()
  j=0
  $('#add-mot').click(function(){
    let id = 'mot-conf-{0}'.format(j)
    appendTemplate($('#mot-setups'), 'motor-block', {'id': 'mot-conf-{0}'.format(j), 'num': j},
    {'del-motor': function(){
      $('#{0}'.format(id)).remove()
    }, 'sel-change': function(){
      var index = this.selectedIndex
      id = this.id.replace('-sound-select', '')
      if(index == 0){
        $("#{0}-mot-sound".format(id))[0].disabled = false
        $("#{0}-mot-sound-lbl".format(id)).removeClass("disabled")
      }else{
        $("#{0}-mot-sound".format(id))[0].disabled = true
        $("#{0}-mot-sound-lbl".format(id)).addClass("disabled")
      }
    }})
    j += 1
  })
  $('#add-mot').click()
  $('#mot-conf-0-del').remove()

  // create_number_input($('#skin-width'), "Skin Width", 0.25, 0.05)

  //

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
      // appendPanel($('#mic-setups'), 'mic-block')
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
    var id = read_num_input('mic-conf-{0}-id'.format(i))
    var pos = read_vec3_input('mic-conf-{0}-pos'.format(i))
    var rot = read_vec3_input('mic-conf-{0}-rot'.format(i), "ROT")
    //READ MIC STYLE
    mic = {"id": id, "local_pos": pos, "local_rot": rot, "mic_style": {"uid": "-1"}}
    mic_setups.push(mic)
  }
  num_mots = $('#mot-setups')[0].children.length
  mot_setups = []
  for(i = 0; i < num_mots; i++){
    var id = read_num_input('mot-conf-{0}-id'.format(i))
    var pos = read_vec3_input('mot-conf-{0}-pos'.format(i))
    mot = {"id": id, "local_pos": pos, "sound": {"uid": "-1"}}
    //READ SOUND SRC
    mot_setups.push(mot)
  }
  code['robot_config'] = {'skin_width': skin_width, "microphones": mic_setups, "motors": mot_setups}

  return code
}
