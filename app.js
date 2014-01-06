var startingSubreddit = 'gif',
    fetchLimit = 100;

window.HugeGif = Ember.Application.create({
  LOG_TRANSITIONS: true
})


// MODELS
HugeGif.Subreddit = Ember.Object.extend({
  loadedLinks: false,
  linkAfter: '',
  title: function(){
    return '/r/' + this.get('id');
  }.property('id'),
  loadLinks: function(){
    var subreddit = this;
    return Em.Deferred.promise(function(p){
      if (subreddit.get('loadedLinks')){
        p.resolve(subreddit.get('links'));
      } else {
        p.resolve($.getJSON('http://reddit.com/r/'+ subreddit.get('id') + '/.json?after='+subreddit.get('linkAfter')+'&limit='+fetchLimit+'&jsonp=?').then(function(response){
          console.log('getting links...');
          var links = Em.A();

          // Only add link if it's a .gif
          response.data.children.forEach(function(child){
            if (child.data.url.match(/\.gif$/ig)) {
              child.data.permalink = 'http://reddit.com'+child.data.permalink;
              links.pushObject(HugeGif.Link.create(child.data));
            } else if (child.data.url.match(/^.+imgur.com\/(\w+$)/ig) && !child.data.url.match(/\/a\/\.imgur\.com/ig)){
              var imgurId = (/^.+imgur.com\/(\w+$)/ig).exec(child.data.url)[1];
              child.data.url = 'http://i.imgur.com/'+imgurId+'.gif';
              child.data.permalink = 'http://reddit.com'+child.data.permalink;
              links.pushObject(HugeGif.Link.create(child.data));
            }
          });

          links.forEach(function(link,i){
            if ((i+1) < links.length) {
              links[i].set('next',links[i+1].id);
            }
            if ((i-1) >= 0) {
              links[i].set('prev',links[i-1].id);
            }
          });
          var linkAfter = response.data.after;
          subreddit.setProperties({
            links: links,
            loadedLinks: true,
            linkAfter: linkAfter });
          return links;
        }));
      }
    });
  },

  findLinkById: function(id){
    return this.loadLinks().then(function(links){
      return links.findProperty('id',id);
    })
  }

});

HugeGif.Subreddit.reopenClass({
  list: function(id){
    if (this._list) { return this._list; }
    var list = Em.A();
    list.pushObject(HugeGif.Subreddit.create({id: startingSubreddit}));

    this._list = list;
    return list;
  },
  defaultSubreddit: function(){
    return this.list()[0];
  },

});

HugeGif.Link = Ember.Object.extend({
  imageUrl: function() {
      var url = this.get('url');
      if (!url) return false;
      if (url.match(/\.gif$/ig) !== null) return url;
      return false;
    }.property('url'),
})

HugeGif.Imgur = Ember.Object.extend({});
HugeGif.Upload = Ember.Object.extend({});

// CONTROLLERS
HugeGif.LinkController = Ember.ObjectController.extend({
  actions: {
    next: function(){
      if (this.get('next')) {
        this.transitionToRoute('link', this.get('next'));
      }
    },
    prev: function(){
      if (this.get('prev')) {
        this.transitionToRoute('link', this.get('prev'));
      }
    }
  }
})

HugeGif.UploadController = Ember.Controller.extend({
  actions: {
    upload: function(){
      var file = this.get("image").split(",")[1];
      var _this = this

      console.log(file)

      console.log('Uploading to imgur...');
      var fd = new FormData();
      fd.append('image', file);

      var xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://api.imgur.com/3/image.json');
      xhr.onload = function(){
        var imgurId = JSON.parse(xhr.responseText).data.id;
        console.log(imgurId);
        _this.transitionToRoute('imgur', imgurId);
      };
      xhr.setRequestHeader('Authorization', 'Client-ID 2b577f722a2e8e9');
      xhr.send(fd);

    }
  }

})

// ROUTES
HugeGif.Router.map(function() {
  this.resource('subreddit', { path: '/r/:subreddit_id' }, function() {
    this.resource('link', { path: '/:link_id'} );
  });
  this.route('upload', { path: '/upload' });
  this.route('notfound', { path: '/notfound' });
  this.resource('imgur', { path: '/:imgur_id' }); // This goes last!
});

HugeGif.LinkRoute = Ember.Route.extend({
  model: function(params){
    return this.modelFor('subreddit').findLinkById(params.link_id);
  }
});

HugeGif.SubredditRoute = Ember.Route.extend({
  model: function(params){
    var sub = HugeGif.Subreddit.list().findProperty('id', params.subreddit_id)
    if (sub){
      return sub;
    } else {
      return HugeGif.Subreddit.create({id: params.subreddit_id});
    }
  },
  afterModel: function(model){
    return model.loadLinks();
  }
});

HugeGif.ImgurRoute = Ember.Route.extend({
  model: function(params){
    return HugeGif.Imgur.image(params.imgur_id);
  }
})


HugeGif.Imgur.reopenClass({
  image: function(imgurId) {
      return $.ajax({
        url: 'https://api.imgur.com/3/image/' + imgurId,
        headers: {
            'Authorization': 'Client-ID 2b577f722a2e8e9'
        },
        type: 'GET',
        success: function(imgData) {
          return imgData.data;
        },
        error: function(){
          alert('oh noez! Fail!');
        }
    }).then(function(response) {
        return HugeGif.Imgur.create(response.data);
      });
  }
});

HugeGif.IndexRoute = Ember.Route.extend({
  redirect: function(){
    this.transitionTo('subreddit', HugeGif.Subreddit.defaultSubreddit());
  }
});

//VIEWS
HugeGif.GetImageView = Ember.TextField.extend({
  tagName: 'input',
  attributeBindings: ['name'],
  type: 'file',
  file: null,
  change: function (e) {
      var reader = new FileReader(),
      _this = this;

      var file = e.target.files[0];
      if (!file || !file.type.match(/image.gif/)) {
        alert('Gotta be a GIF');
        return;
      }

      reader.onload = function (e) {
          var fileToUpload = e.srcElement.result;
          Ember.run(function() {
              _this.set('file', fileToUpload);
          });
      };
      return reader.readAsDataURL(file);
  }
})

HugeGif.EventView = Ember.View.extend({
  keyDown: function(e){
    var key = e.which

    if(key === 32) this.controller.send("next"); // space
    else if (key === 39) this.controller.send("next"); // right
    else if (key === 37) this.controller.send("prev"); // left
  },
  click: function(e){
    console.log("click",e)
  }
})
