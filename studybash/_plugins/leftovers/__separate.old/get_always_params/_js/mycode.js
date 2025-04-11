function do_ajax() {

    $.ajax({        
        url : "ajax.php",
        data : {
            'filename' : 'findme.txt'
        },
        dataType : 'json',
        type : 'POST',
        timeout : 10000
    })
    .done(function(data,textStatus,jqXHR) {                    

        console.log("Done:");
        console.log(data);
    })
    .fail(function(jqXHR,textStatus,errorThrown) {

        console.log("Fail: " + textStatus + " (" + errorThrown + ")");
    })
    .always(function(a,b,c){
        console.log($.get_always_params(a,b,c));
    });

}