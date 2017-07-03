import Ember from 'ember';

const { inject: { service } } = Ember;

export default Ember.Route.extend({
  github: service(),

  async beforeModel() {
    try {
      await this.get('github.validateToken').perform();
    } catch(error) {
      this.replaceWith('login');
    }
  }
});

