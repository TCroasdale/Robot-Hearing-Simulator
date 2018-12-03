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

  $('#run_conf').click(function(){
    var config = editor.getValue()
    $('#spinner').show()
    $.post('/simulator/run_simulation', {config: config}, function(data){
      $('#spinner').hide()
      if(data.success == 'true')
        window.location.href = 'dl/' + data.file;
    })
  })
})
