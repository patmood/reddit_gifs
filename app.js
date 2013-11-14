var defaultSubreddits = [
  'gifs',
  'thestopgirl'
];


window.HugeGif = Ember.Application.create({
  LOG_TRANSITIONS: true
})


HugeGif.Subreddit = Ember.Object.extend({
  loadedLinks: false,
  title: function(){
    return '/r/' + this.get('id');
  }.property('id'),
  loadLinks: function(){
    var subreddit = this;
    return Em.Deferred.promise(function(p){
      if (subreddit.get('loadedLinks')){
        p.resolve(subreddit.get('links'));
      } else {
        p.resolve($.getJSON('http://reddit.com/r/'+ subreddit.get('id') + '/.json?jsonp=?').then(function(response){
          var links = Em.A();
          response.data.children.forEach(function(child){
            child.data.subreddit = subreddit;
            links.pushObject(HugeGif.Link.create(child.data));
          });
          subreddit.setProperties({links: links, loadedLinks: true });
          return links;
        }));
      }
    });
  },

  findLinkById: function(id){
    return this.loadedLinks().then(function(links){
      return links.findProperty('id',id);
    })
  }

});

HugeGif.Subreddit.reopenClass({
  list: function(id){
    if (this._list) { return this._list; }
    var list = Em.A();
    defaultSubreddits.forEach(function(id){
      list.pushObject(HugeGif.Subreddit.create({id: id}));
    });

    this._list = list;
    return list;
  },
  defaultSubreddit: function(){
    return this.list()[0];
  }
});



// MODELS
HugeGif.Link = Ember.Object.extend({
  imageUrl: function() {
        var url = this.get('url');
        if (!url) return false;
        if (url.match(/\.gif$/ig) !== null) return url;
        return false;
      }.property('url')
})

// ROUTESR
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
    return HugeGif.Subreddit.list().findProperty('id', params.subreddit_id);
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
