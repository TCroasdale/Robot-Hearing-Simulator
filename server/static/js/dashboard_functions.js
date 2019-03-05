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