var startingSubreddit = 'gifs',
    fetchLimit = 10;

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

// ROUTES
HugeGif.Router.map(function() {
  this.resource("subreddit", { path: "/r/:subreddit_id" }, function() {
    this.resource('link', { path: '/:link_id'} );
  });
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

// HugeGif.ApplicationRoute = Ember.Route.extend({
// })

HugeGif.IndexRoute = Ember.Route.extend({
  redirect: function(){
    this.transitionTo('subreddit', HugeGif.Subreddit.defaultSubreddit());
  }
});
