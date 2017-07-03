import Ember from 'ember';

const { inject: { service } } = Ember;

export default Ember.Route.extend({
  github: service(),

  async model() {
    let content = await this.get('github.readFile').perform('ember-learn', 'builds', 'app/fixtures/ember/beta.js');

		content = content.replace('export default', 'return');

    return eval(`(function() {${content}})()`);
  }
});

