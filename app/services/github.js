import Ember from 'ember';
import { isUnauthorizedError } from 'ember-ajax/errors';
import { task } from 'ember-concurrency';

const { inject: { service } } = Ember;

const TOKEN_NAME = 'Ember Core Dashboard';

const GITHUB_HOST = 'https://api.github.com';
const GITHUB_HEADERS = Object.freeze({
  'Content-Type': 'application/vnd.github.v3+json'
});

export const E_BAD_CREDENTIALS = 'BAD CREDENTIALS';
export const E_BAD_OTP = 'BAD OTP';
export const E_BAD_TOKEN = 'BAD TOKEN';

export default Ember.Service.extend({
  ajax: service(),

  token: '739daa7d3f65f4753582d4a5d063396fd82c933a', // Hardcode a token here to make development easier
  user: null,

  login: task(function * (username, password, otp) {
    this.setProperties({
      token: null,
      user: null
    });

    let ajax = this.get('ajax');

    try {
      let url = `${GITHUB_HOST}/authorizations`;
      let auth = btoa(`${username}:${password}`);
      let headers = {
        'Authorization': `Basic ${auth}`,
        'X-GitHub-OTP': otp,
        ...GITHUB_HEADERS
      };

      while (true) {
        let response = yield ajax.raw(url, { headers });
        let token = response.payload.find(t => t.app.name === TOKEN_NAME);

        if (token) {
          url = `${GITHUB_HOST}/authorizations/${token.id}`;

					yield ajax.raw(url, {
            method: 'DELETE',
            headers
          });

          break;
        }

      	let match = response.jqXHR.getResponseHeader("Link").match(/<(.+)>; rel="next"/);

        if (match) {
          url = match[1];
        } else {
          break;
        }
      }

      url = `${GITHUB_HOST}/authorizations`;

      let response = yield ajax.raw(url, {
        method: 'POST',
        headers,
        data: JSON.stringify({
          scopes: ['repo'],
          note: 'Ember Core Dashboard'
        })
      });

      this.set('token', response.payload.token);

      return this.get('validateToken').perform();
    } catch(error) {
			if (isUnauthorizedError(error.response)) {
        if (error.jqXHR.getResponseHeader('X-GitHub-OTP')) {
          throw new Error(E_BAD_OTP);
        } else {
          throw new Error(E_BAD_CREDENTIALS);
        }
      }

      throw error;
    }
  }).restartable(),

  validateToken: task(function * () {
    let { ajax, token } = this.getProperties('ajax', 'token');

    try {
      if (!token) {
        throw new Error('Missing token');
      }

			let url = `${GITHUB_HOST}/user`;
      let headers = {
        'Authorization': `token ${token}`,
        ...GITHUB_HEADERS
      };

      let user = yield ajax.request(url, { headers });

      this.set('user', user);

      return true;
    } catch(error) {
      this.set('token', null);

      throw new Error(E_BAD_TOKEN);
    }
  }).restartable(),

  createBranch: task(function * (owner, repo, branch, { base = 'master' } = {}) {
    let { ajax, token } = this.getProperties('ajax', 'token');

    let url = `${GITHUB_HOST}/repos/${owner}/${repo}/git/refs/heads/${base}`;
    let headers = {
      'Authorization': `token ${token}`,
      ...GITHUB_HEADERS
    };

    let { object: { sha } } = yield ajax.request(url, { headers });

    url = `${GITHUB_HOST}/repos/${owner}/${repo}/git/refs`;

    return ajax.request(url, {
      method: 'POST',
      headers,
      data: JSON.stringify({
   			ref: `refs/heads/${branch}`,
				sha
 			})
    });
  }),

  readFile: task(function * (owner, repo, path) {
    let { ajax, token } = this.getProperties('ajax', 'token');

    let url = `${GITHUB_HOST}/repos/${owner}/${repo}/contents/${path}`;
    let headers = {
      'Authorization': `token ${token}`,
      ...GITHUB_HEADERS
    };

    let response = yield ajax.request(url, { headers });

    return atob(response.content);
  }),

  createFile: task(function * (owner, repo, path, message, content, { branch } = {}) {
    let { ajax, token } = this.getProperties('ajax', 'token');

    let url = `${GITHUB_HOST}/repos/${owner}/${repo}/contents/${path}`;
    let headers = {
      'Authorization': `token ${token}`,
      ...GITHUB_HEADERS
    };

    return ajax.request(url, {
      method: 'PUT',
      headers,
      data: JSON.stringify({
        path,
        message,
        branch,
        content: btoa(content)
      })
    });
  }),

  createPullRequest: task(function * (owner, repo, title, head, base, body) {
    let { ajax, token } = this.getProperties('ajax', 'token');

    let url = `${GITHUB_HOST}/repos/${owner}/${repo}/pulls`;
    let headers = {
      'Authorization': `token ${token}`,
      ...GITHUB_HEADERS
    };

    return ajax.request(url, {
      method: 'POST',
      headers,
      data: JSON.stringify({
        title,
        head,
        base,
        body
      })
    });
  }),
});

