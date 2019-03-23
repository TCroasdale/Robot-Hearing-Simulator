function loadDocumentation(page){
  $.get('/documentation?p=' + page, function(data){
    console.log(data)
    if(data.success === "true"){
      console.log(data.html)
      $('#doc-section')[0].innerHTML = data.html
    }
    else{
      $('#doc-section')[0].innerHTML = "<h1 class='text-danger'>load doc failed!</h1>"
    }
  })
}


$(document).ready(function(){
  loadDocumentation('introduction')
})
