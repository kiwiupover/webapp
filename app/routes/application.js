import Ember from 'ember';
import ApplicationRouteMixin from 'ember-simple-auth/mixins/application-route-mixin';
import config from 'webapp/config/environment';

const { service } = Ember.inject;

export default Ember.Route.extend(ApplicationRouteMixin, {

  translationsFetcher: service('translations-fetcher'),
  ajax: service('ajax'),
  errorHandler: service('error-handler'),
  conversationsService: service('conversations'),

  beforeModel(transition) {
    this._super(transition);
    // Fetch translations from server
    return this.get('translationsFetcher').fetch();
  },

  setupController() {
    if (this.get('session.isAuthenticated')) {
      this.get('conversationsService').startCountsAutoReload();
    }
  },

  title(tokens) {
    tokens = Ember.makeArray(tokens);
    tokens.unshift('WWOOF France');
    return tokens.reverse().join(' — ');
  },

  /**
   * Performs post-login actions.
   */
  sessionAuthenticated() {
    let attemptedTransition = this.get('session.attemptedTransition');

    if (attemptedTransition) {
      this.get('sessionUser.user').then((user) => {

        if (this.get('i18n.locale') !== user.get('locale')) {
          this.get('translationsFetcher').fetch();
        }

        attemptedTransition.retry();
        this.set('session.attemptedTransition', null);
      });
    } else {
      window.location.replace(config.urlAfterLogin);
    }
  },

  /**
   * Redirects user after logout.
   * Refreshes the page to reset app state.
   */
  sessionInvalidated() {
    window.location.replace(config.urlAfterLogout);
  },

  getUrl(userId, hostId) {
    return ['api/users', userId, 'favorites', hostId].join('/');
  },

  actions: {
    invalidateSession() {
      this.get('session').invalidate();
    },
    userImpersonated() {
      this.store.unloadAll();
      this.get('conversationsService').getConversationCounts();
      this.transitionTo('hosts.index');
      this.refresh();
    },
    addUserFavorite(host, user) {
      if (!user) {
        this.transitionTo('login');
      } else {
        let url = this.getUrl(user.get('id'), host.get('id'));
        let promise = this.get('ajax').put(url);

        promise.then(() => {
          user.get('favorites').pushObject(host);
        });
      }
    },
    removeUserFavorite(host, user) {
      if (!user) {
        this.transitionTo('login');
      } else {
        let url = this.getUrl(user.get('id'), host.get('id'));
        let promise = this.get('ajax').delete(url);

        promise.then(()=> {
          user.get('favorites').removeObject(host);
        });
      }
    },
    error(err) {
      if (Ember.get(err, 'errors.firstObject.status') === '404') {
        this.transitionTo('404', 'not-found');
      } else {
        this.get('errorHandler').handleError(err);
      }
    }
  }
});
