function fetchEditorState(){
  if(ace.edit("editor").getValue() == ""){
    // Return a default config if editor is empty
    return {
     "robot_config": {
      "skin_width": 0.25,
      "microphones": [{"id": 0,
        "local_pos": { "x": 0, "y": 0, "z": 0},
        "local_rot": {"x": 0,"y": 0,"z": 0},
        "mic_style": {"uid": -1}}],
      "motors": [{"id": 0,
        "local_pos": {"x": 0,"y": 0,"z": 0},
        "sound": {"uid": -1}}]
     }
    }

  }else{
    return JSON.parse(ace.edit("editor").getValue())
  }
}

function addMotorPanel(){
  num_children= $('#mot-setups')[0].children.length
  child = $('#mot-setups')[0].children[num_children-1]
  var i = 0
  if(num_children > 0) i = Number(child.id.match(/\d+/)[0]) + 1
  let id = 'mot-conf-{0}'.format(i)
  appendTemplate($('#mot-setups'), 'motor-block', {'id': id, 'num': i},
  {'del-motor': function(){ //Function to remove a motor
    $('#{0}'.format(id)).remove()
  }, 'sel-change': function(){ //Function to disable file upload if needed
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
  // ===== Add Update functions =====
  $('#{0} input'.format(id)).change(function(){
    update3DView(compile_code())
  })
  $('#{0}-del'.format(id)).click(function(){
    update3DView(compile_code())
  })

  update3DView(compile_code())

  return id
}


function addMicPanel(){
  num_children= $('#mic-setups')[0].children.length
  child = $('#mic-setups')[0].children[num_children-1]
  var i = 0
  if(num_children > 0) i = Number(child.id.match(/\d+/)[0]) + 1
  let id = 'mic-conf-{0}'.format(i)
  appendTemplate($('#mic-setups'), 'mic-block', {'id': id, 'num': i},
  {'del-mic': function(){
    $('#{0}'.format(id)).remove()
  }})
  // ===== Add Update functions =====
  $('#{0} input'.format(id)).change(function(){
    update3DView(compile_code())
  })
  $('#{0}-del'.format(id)).click(function(){
    update3DView(compile_code())
  })

  update3DView(compile_code())
  return id
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
      }
    });
  })

  // ===== Setting up 3D Viewer =====
  sceneView.createRoom(5, 5, 5, 0xeeeeee, 0x222222)
  robot = sceneView.createSphere(1.0, 0x3f7faa, true)
  mics = [sceneView.createCone(0.2, 0.2)]
  motors = [sceneView.createSphere(0.1, 0x44ee44)]



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
      if(!soundupload.disabled){ //If an existing sound is selected
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
        $('#uploadpopup').modal("hide")
      },
      cache: false,
      contentType: false,
      dataType: 'json',
      enctype: 'multipart/form-data',
      processData: false
    });

  })

  //Creating the UI
  $('#add-mic').click(function(){
    addMicPanel()
  })
  $('#add-mic').click()
  $('#mic-conf-0-del').remove()

  $('#add-mot').click(function(){
    addMotorPanel()
  })
  $('#add-mot').click()
  $('#mot-conf-0-del').remove()

  editor.on('change', function(obj){
    try{
      update_UI(fetchEditorState())
      update3DView(fetchEditorState())
    }
    catch{
      console.log("invalid json")
    }
  })

  $('input').change(function(){
    update3DView(compile_code())
  })

  $('#code-tab').click(function(e){
    var newSesh = new EditSession(JSON.stringify(compile_code(), null, " "))
    newSesh.setMode("ace/mode/javascript");
    editor.setSession(newSesh)
  })

})

function update_UI(conf){

  set_number_input('skin-width', conf['robot_config']['skin_width'])

  var mic_setups = conf['robot_config']["microphones"]
  $('#mic-setups').empty()
  for(var i = 0; i < mic_setups.length; i++){
    id = addMicPanel()
    set_number_input('{0}-id'.format(id), mic_setups[i]['id'])
    set_vec3_input('{0}-pos'.format(id), mic_setups[i]['local_pos'])
    set_vec3_input('{0}-rot'.format(id), mic_setups[i]['local_rot'], "ROT")

  }
  var mot_setups = conf['robot_config']["motors"]
  $('#mot-setups').empty()
  for(i = 0; i < mot_setups.length; i++){
    id = addMotorPanel()
    set_number_input('{0}-id'.format(id), mot_setups[i]['id'])
    set_vec3_input('{0}-pos'.format(id), mot_setups[i]['local_pos'])

  }

}

function compile_code(){
  console.log("Compiling robot to code..")
  code = {}
  var skin_width = read_num_input('skin-width')

  num_mics = $('#mic-setups')[0].children.length

  mic_setups = []
  for(i = 0; i < num_mics; i++){
    var id = $('#mic-setups')[0].children[i].id
    var mic_id = read_num_input('{0}-id'.format(id))
    var pos = read_vec3_input('{0}-pos'.format(id))
    var rot = read_vec3_input('{0}-rot'.format(id), "ROT")
    //READ MIC STYLE
    mic = {"id": mic_id, "local_pos": pos, "local_rot": rot, "mic_style": {"uid": -1}}
    mic_setups.push(mic)
  }
  $('#mic-conf-0-del').remove()

  num_mots = $('#mot-setups')[0].children.length
  mot_setups = []
  for(i = 0; i < num_mots; i++){
    var id = $('#mot-setups')[0].children[i].id
    var mot_id = read_num_input('{0}-id'.format(id))
    var pos = read_vec3_input('{0}-pos'.format(id))
    mot = {"id": mot_id, "local_pos": pos, "sound": {"uid": -1}}
    //READ SOUND SRC
    mot_setups.push(mot)
  }
  $('#mot-conf-0-del').remove()

  code['robot_config'] = {'skin_width': skin_width, "microphones": mic_setups, "motors": mot_setups}
  return code
}


function update3DView(config){
  console.log("Updating your view.")

  robot.scale.x = Number(config['robot_config']['skin_width'])
  robot.scale.y = Number(config['robot_config']['skin_width'])
  robot.scale.z = Number(config['robot_config']['skin_width'])

  motor_confs = config['robot_config']['motors']
  for(var i in motors){
    sceneView.scene.remove(motors[i])
  }
  motors = []
  for(var i in motor_confs){
    conf = motor_confs[i]
    motors.push(sceneView.createSphere(0.1, 0x44ee44))
    motors[i].position.x = Number(conf['local_pos']['x'])
    motors[i].position.y = Number(conf['local_pos']['y'])
    motors[i].position.z = Number(conf['local_pos']['z'])
  }

  mic_confs = config['robot_config']['microphones']
  for(var i in mics){
    sceneView.scene.remove(mics[i])
  }
  mics = []
  for(var i in mic_confs){
    conf = mic_confs[i]
    mics.push(sceneView.createCone(0.2, 0.2))
    mics[i].position.x = Number(conf['local_pos']['x'])
    mics[i].position.y = Number(conf['local_pos']['y'])
    mics[i].position.z = Number(conf['local_pos']['z'])

    mics[i].rotation.x = Number(conf['local_rot']['x'])* (Math.PI / 180)
    mics[i].rotation.y = Number(conf['local_rot']['y'])* (Math.PI / 180)
    mics[i].rotation.z = Number(conf['local_rot']['z'])* (Math.PI / 180)
  }

}
