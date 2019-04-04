function deleteSimulation(id){
  $.post('/removesimulation', {sim_id: id}, function(data){
    if(data.success == "true"){
      $('#sim_' + id).remove()
    }
  })
}

function deleteSound(id){
  $.post('/removesound', {sound_id: id}, function(data){
    if(data.success == "true"){
      $('#sound_' + id).remove()
    }
  })
}

function deleteRobot(id){
  $.post('/removerobot', {robot_id: id}, function(data){
    if(data.success == "true"){
      $('#robot_' + id).remove()
    }
  })
}

function deleteMic(id){
  $.post('/removemic', {mic_id: id}, function(data){
    if(data.success == "true"){
      $('#mic_' + id).remove()
    }
  })
}

function endTask(id){
  $.post('/revoke_simulation', {sim_id: id}, function(data){
    if(data.success == "true"){
      $('#sim_' + id+'-state').text("killed")
    }
  })
}

function playSound(src){
  $("#audio-src").attr("src", src)
  $("#sound-preview")[0].pause()
  $("#sound-preview")[0].load()
  $("#sound-preview")[0].oncanplaythrough = $("#sound-preview")[0].play();
}

function openModal(type, id){
  $('#publish-modal').modal("show")

  $('#item-type').val(type)
  $('#item-id').val(id)
}

function openSimModal(id){
  $('#run-sim-modal').modal("show")
  $('#sim-id').val(id)
}

$(document).ready(function(){
  $('[data-toggle="tooltip"]').tooltip();

  $('#re-run-sim').click(function(){
    //Add utterance and bgnoise to formdata
    fData = new FormData();
    uttupload = $('#utterancefile')
    console.log(fData);
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

    fData.append('sim_id', $('#sim-id')[0].value)

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
});
