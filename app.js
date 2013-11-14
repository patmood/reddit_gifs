var startingSubreddit = 'gifs';


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
        p.resolve($.getJSON('http://reddit.com/r/'+ subreddit.get('id') + '/.json?limit=10&jsonp=?').then(function(response){
          var links = Em.A();
          response.data.children.forEach(function(child){
            child.data.subreddit = subreddit;
            links.pushObject(HugeGif.Link.create(child.data));
          });
          links.forEach(function(link,i){
            if ((i+1) < links.length) {
              links[i].set('next',links[i+1].id);
            }
            if ((i-1) >= 0) {
              links[i].set('prev',links[i-1].id);
            }
          });
          var linkBefore = response.data.before;
          var linkAfter = response.data.after;
          subreddit.setProperties({links: links, loadedLinks: true, linkBefore: linkBefore, linkAfter: linkAfter });
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
    list.pushObject(HugeGif.Subreddit.create({id: startingSubreddit}));

    this._list = list;
    return list;
  },
  defaultSubreddit: function(){
    return this.list()[0];
  },

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
