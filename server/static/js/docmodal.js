function loadDocumentation(page){
  $.get('/documentation?p=' + page, function(data){
    if(data.success === "true"){
      $('#doc-section')[0].innerHTML = data.html
    }
    else{
      $('#doc-section')[0].innerHTML = "<h1 class='text-danger'>load doc failed!</h1><p>This could be due to an invalid request, or a loss of internet connection.</p>"
    }
  })
}


$(document).ready(function(){
  loadDocumentation('introduction')
})
