$(document).ready(function(){

  $('#huge').click(function(){ loadGif(++gifPos); });
  $('#next').click(function(){ loadGif(++gifPos); });
  $('#prev').click(function(){ loadGif(--gifPos); });

  var gifList = [];
  var gifPos = 0;
  fetchGifs();

  function fetchGifs(source){
    if(typeof(source)==='undefined') source = 'http://www.reddit.com/r/gif/.json?jsonp=?';
    $.getJSON(source, function(data) {
        $.each(data.data.children, function(i,item){
            if (item.data.url.match(/\.gif$/ig)){
              gifList.push({
                id: item.data.id,
                url: item.data.url,
                title: item.data.title,
                permalink: item.data.permalink
              });
            }
        });
        if (gifPos === 0) loadGif(gifPos);
        console.log(gifList);
    });
  }

  function loadGif(gifData){
    $('#huge').html($('<img/>').attr("src", gifList[gifData].url));
    $('#title').html(gifList[gifData].title)
    console.log(gifPos);
    if (gifPos >= gifList.length-15) getMoreGifs();
  }

  function getMoreGifs(){
    alert("Get more gifs now")
  }

  // keyboard controls
  $(document).keydown(function(e){
    var key = e.which

    // arrow keys
    if(key === 32) loadGif(++gifPos) // space
    else if (key === 39) loadGif(++gifPos) // right
    else if (key === 37) loadGif(--gifPos) // left
    // else if (key === 38) vote("up") // up
    // else if (key === 40) vote("down") // down
  })
});
