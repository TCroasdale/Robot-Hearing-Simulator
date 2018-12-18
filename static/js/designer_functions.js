$(document).ready(function() {
  $('#uploadpopup').modal("hide")

  var editor = ace.edit("editor");
  editor.setTheme("ace/theme/monokai");
  editor.session.setMode("ace/mode/javascript");

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

})
