$(document).ready(function(){

  $('#huge').click(function(){ nextGif(); });
  $('#next').click(function(){ nextGif(); });
  $('#prev').click(function(){ prevGif(); });

  var gifList = [];
  var gifPos = 0;
  var fetchReddit = 'gifs';
  var fetchLimit = 25;
  var fetchAfter = '';
  var fetching = false;

  fetchGifs();

  $('#subreddit').on('change', function(){
    fetchReddit = $(this).val().replace(/(\/r\/)|(r\/)|(\/)/ig,'');
    gifList.length = gifPos-1;
    console.log("List length:",gifList.length);
    fetchGifs();
  })

  function fetchGifs(){
    console.log("Getting more gifs from",fetchReddit,"...")
    var errorTimeout = setTimeout(function(){
      alert('No gifs found for the subreddit "',fetchReddit,'"');
      fetchReddit = 'gif'
    }, 5000);
    var source = 'http://www.reddit.com/r/'+fetchReddit+'/.json?limit='+fetchLimit+'&after='+fetchAfter+'&jsonp=?'
    fetching = true;
    $.getJSON(source, function(data) {
      clearTimeout(errorTimeout);
      $.each(data.data.children, function(i,item){
          var url = item.data.url;
          if (url.match(/\.gif$/ig)){
            gifList.push({
              id: item.data.id,
              url: url,
              title: item.data.title,
              permalink: item.data.permalink
            });
          } else if (url.match(/imgur/ig) && !url.match(/\/a\//ig)){
            gifList.push({
              id: item.data.id,
              url: directImgurLink(url),
              title: item.data.title,
              permalink: item.data.permalink
            });
          }
      });
      fetchAfter = data.data.after;
      if (gifPos === 0) loadGif(gifList[0]);
      fetching = false;
      console.log(gifList);
      console.log("List length:",gifList.length);
    });
  }

  function loadGif(gifData){
    if (!gifData) return
    $('#huge').html($('<img/>').attr("src", gifData.url));
    $('#title').html(gifData.title)
    console.log(gifPos);
    if (gifPos >= gifList.length-5 && !fetching) fetchGifs();
  }

  function directImgurLink(link){
    console.log("Imgur fix!");
    console.log("Original:",link);
    var imgurId = (/^.+imgur.com\/(\w+)/ig).exec(link)[1];
    console.log("ID:",imgurId);
    return 'i.imgur.com/'+imgurId+'.gif';
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
