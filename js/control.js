$(document).ready(function(){

  $('#huge').click(function(){ nextGif(); });
  $('#next').click(function(){ nextGif(); });
  $('#prev').click(function(){ prevGif(); });

  var gifList = [];
  var gifPos = 0;
  var defaultSource = 'http://www.reddit.com/r/gif/.json?';
  var fetchReddit = $('#subreddit').val();
  var fetchLimit = 100;
  var fetchAfter = '';
  var fetching = false;

  fetchGifs();

  $('#subreddit').on('change', function(){
    fetchReddit = $(this).val().replace(/(\/r\/)|(r\/)|(\/)/ig,'');
  })

  function fetchGifs(source){
    var errorTimeout = setTimeout(function(){
      alert('No gifs found for the subreddit "',fetchReddit,'"');
    }, 5000);
    if(typeof(source)==='undefined') source = defaultSource;
    fetching = true;
    $.getJSON(source+'&jsonp=?', function(data) {
      clearTimeout(errorTimeout);
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
      fetchAfter = data.data.after;
      if (gifPos === 0) loadGif(gifList[gifPos]);
      fetching = false;
      console.log(gifList);
    });
  }

  function loadGif(gifData){
    if (!gifData) return
    $('#huge').html($('<img/>').attr("src", gifData.url));
    $('#title').html(gifData.title)
    console.log(gifPos);
    if (gifPos >= gifList.length-5 && !fetching) getMoreGifs();
  }

  function getMoreGifs(){
    var nextSource = 'http://www.reddit.com/r/'+fetchReddit+'/.json?limit='+fetchLimit+'&after='+fetchAfter;
    console.log("Get more gifs now...")
    fetchGifs(nextSource);
  }

  function nextGif(){
    if (gifPos+1 < gifList.length){
      loadGif(gifList[++gifPos])
    } else {
      return
    }
  }

  function prevGif(){
    if (gifPos-1 >= 0){
      loadGif(gifList[--gifPos])
    } else {
      return
    }
  }


  // keyboard controls
  $(document).keydown(function(e){
    var key = e.which

    // arrow keys
    if(key === 32) nextGif() // space
    else if (key === 39) nextGif() // right
    else if (key === 37) prevGif() // left
    // else if (key === 38) vote("up") // up
    // else if (key === 40) vote("down") // down
  })
});
