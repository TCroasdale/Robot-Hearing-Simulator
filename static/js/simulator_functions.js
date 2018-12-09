$(document).ready(function() {
  $('#spinner').hide()
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

  // $('#sound-uploads-form').submit(function(data){
  //   if(data.success == "true"){
  //     var config = editor.getValue()
  //     $.post('/simulator/run_simulation', {config: config}, function(data){
  //       $('#spinner').hide()
  //     })
  //   }else{
  //     $('#spinner').hide()
  //   }
  // })

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
            console.log(jsConfig)
            jsConfig.simulation_config.source_config.input_utterance.uid = data.sound_ids.utterance_id
            $.post('/simulator/run_simulation', {config: config}, function(data){
              $('#spinner').hide()
            })
          }else{
            $('#spinner').hide()
          }
        },
        cache: false,
        contentType: false,
        processData: false
    });
});

  $('#run_conf').click(function(){
    $('#spinner').show()
    $('#sound-uploads-form').submit()
  })


})
