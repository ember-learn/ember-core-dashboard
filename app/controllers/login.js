import Ember from 'ember';
import { task } from 'ember-concurrency';
import { E_BAD_CREDENTIALS, E_BAD_OTP } from '../services/github';

const { computed: { and, equal, not }, inject: { service } } = Ember;

export default Ember.Controller.extend({
  github: service(),

  username: null,
  password: null,
  otp: null,

  hasSignIn: and('username', 'password'),
  disableSignIn: not('hasSignIn'),
  disableVerify: not('otp'),

	step: 'credentials',
  isCredentials: equal('step', 'credentials'),
  isOTP: equal('step', 'otp'),

  submit: task(function * () {
    let {
      github, username, password, otp
    } = this.getProperties(
      'github', 'username', 'password', 'otp'
    );

    try {
      yield github.get('login').perform(username, password, otp);

      this.setProperties({
        username: null,
        password: null,
        otp: null,
        step: 'credentials'
      });

			this.transitionToRoute('index');
    } catch(error) {
      if (error.message === E_BAD_CREDENTIALS) {
        this.setProperties({
          step: 'credentials',
          password: null,
          otp: null
        });

        throw new Error('Incorrect username or password.');
      } else if (error.message === E_BAD_OTP) {
        this.setProperties({
          step: 'otp',
          otp: null
        });

        if (otp) {
          throw new Error('Two-factor authentication failed.');
        } else {
          return;
        }
      }

      throw error;
    }
  }).restartable()
});

