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


  $("#sound-uploads-form").submit(function(e) {
    e.preventDefault();
    var formData = new FormData(this);

    $.ajax({
        url: 'simulator/uploadsounds',
        type: 'POST',
        data: formData,
        success: function (data) {
          if(data.success == "true"){
            var config = editor.getValue()
            jsConfig = JSON.parse(config)
            jsConfig.simulation_config.source_config.input_utterance.uid = data.sound_ids.utterance_id

            $.post('/simulator/run_simulation', {config: JSON.stringify(jsConfig)}, function(data){
              $('#uploadpopup').modal("hide")
            })
          }else{
            $('#uploadpopup').modal("hide")
          }
        },
        cache: false,
        contentType: false,
        processData: false
    });
});

  $('#run_conf').click(function(){
    $('#uploadpopup').modal({backdrop: 'static', keyboard: false})
    $('#sound-uploads-form').submit()
  })


})
