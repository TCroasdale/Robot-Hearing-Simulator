function addLike(id){
    $.post("/toggle_like", {item: id}, function(data){
        $('#item-'+id+'-like-count')[0].innerHTML = data.like_count
    })
}

function addToUser(id){
    $.post("/toggle_add", {item: id}, function(data){
        $('#item-'+id+'-add-count')[0].innerHTML = data.add_count
    })
}