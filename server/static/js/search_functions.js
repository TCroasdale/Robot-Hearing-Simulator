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

function searchQuery(type, query, input_id){
    url = '/quicksearch?query='+query
    if(type !== 'ALL'){
        url += ('&type=' + type)
    }
    $('#search-results').empty()


    $.get(url, function(data){
        console.log(data);
        data.result.forEach(addSearchCard)
        
        function addSearchCard(item){
            $('#card-{0}'.format(item.id)).remove()
            appendTemplate($('#search-results'), 'search-result', {'id': item.id})

            $('#card-{0}-type'.format(item.id))[0].innerHTML = item.type
            $('#card-{0}-like-count'.format(item.id))[0].innerHTML = item.likes
            $('#card-{0}-name'.format(item.id))[0].innerHTML = item.name
            $('#card-{0}-desc'.format(item.id))[0].innerHTML = item.desc

            $('#card-{0}'.format(item.id)).click(function(){
                $('#' + input_id).val(item.id)
                $('#public-search-modal').modal("hide")
            })
        }
    })
}
lastSearchType = "ALL"
function openSearchModal(searchFor, input_id){
    $('#public-search-modal').modal("show")
    $('#clr-search-selection').click(function(){
        $('#' + input_id).val("-1")
    })
    searchQuery(searchFor, "", input_id)
    lastSearchType = searchFor
}

$(document).ready(function(){
    $('#quick-search-form').on('submit', function(e){
        e.preventDefault();

        searchQuery(lastSearchType, $('#modal-search-query').val())
    });
});


$(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip();
  });