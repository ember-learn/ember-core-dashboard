import Ember from 'ember';
import { task } from 'ember-concurrency';

const { computed, computed: { reads }, inject: { service } } = Ember;

export default Ember.Controller.extend({
  github: service(),

  majorVersion: computed('model.finalVersion', function () {
    let version = this.get('model.finalVersion');
    let match = version.match(/^([0-9])\./);

    if (match) {
      let [_, major] = match;
      return parseInt(major, 10);
    } else {
      return 3;
    }
  }),

  minorVersion: computed('model.finalVersion', function () {
    let version = this.get('model.finalVersion');
    let match = version.match(/^([0-9])\.([0-9]+)\./);

    if (match) {
      let [_, major, minor] = match;
      return parseInt(minor, 10);
    } else {
      return 0;
    }
  }),

  version: computed('majorVersion', 'minorVersion', function () {
    let { majorVersion, minorVersion } = this.getProperties('majorVersion', 'minorVersion');
    return `${majorVersion}.${minorVersion}`;
  }),

  betaVersion: computed('majorVersion', 'minorVersion', function () {
    let { majorVersion, minorVersion } = this.getProperties('majorVersion', 'minorVersion');
    return `${majorVersion}.${minorVersion+1}`;
  }),

  previousVersion: computed('majorVersion', 'minorVersion', function () {
    let { majorVersion, minorVersion } = this.getProperties('majorVersion', 'minorVersion');
    return `${majorVersion}.${minorVersion-1}`;
  }),

  releaseDate: reads('model.cycleEstimatedFinishDate'),

  title: computed('version', 'betaVersion', function() {
    let { version, betaVersion } = this.getProperties('version', 'betaVersion');
    return `Ember ${version} and ${betaVersion} Beta Released`;
  }),

  authors: reads('github.user.name'),

  pullRequestTitle: computed('version', function() {
    let version = this.get('version');
    return `Ember ${version} Release Blog Post`;
  }),

  branch: computed('version', function() {
    let version = this.get('version');
    let name = `${version}-release-blog-post`;
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }),

  path: computed('version', function() {
    let { version, releaseDate } = this.getProperties('version', 'releaseDate');
    let filename = `${releaseDate}-ember-${version}-released`;
    filename = filename.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `source/blog/${filename}.md`;
  }),

  emberjsSignOff: '@chancancode',
  emberDataSignOff: '@bmac',
  emberCLISignOff: '@rwjblue',
  websiteSignOff: '@locks, @mixonic',

  submit: task(function * () {
    let {
      github, branch, path, title, authors, version, betaVersion, previousVersion, pullRequestTitle
    } = this.getProperties(
      'github', 'branch', 'path', 'title', 'authors', 'version', 'betaVersion', 'previousVersion', 'pullRequestTitle'
    );

    try {
      yield github.get('createBranch').perform('emberjs', 'website', branch);
    } catch(error) {
      throw new Error(`Cannot create branch "${path}": ${error.message}`);
    }

    try {
      let content = `---
title: ${title}
author: ${authors}
tags: Releases
---

Today the Ember project is releasing version ${version}.0 of Ember.js, Ember Data, and Ember CLI.

This release kicks off the ${betaVersion} beta cycle for all sub-projects. We encourage our
community (especially addon authors) to help test these beta builds and report
any bugs before they are published as a final release in six weeks' time. The
[ember-try](https://github.com/ember-cli/ember-try) addon is a great way to
continuously test your projects against the latest Ember releases.

You can read more about our general release process here:

- [Release Dashboard](http://emberjs.com/builds/)
- [The Ember Release Cycle](http://emberjs.com/blog/2013/09/06/new-ember-release-process.html)
- [The Ember Project](http://emberjs.com/blog/2015/06/16/ember-project-at-2-0.html)
- [Ember LTS Releases](http://emberjs.com/blog/2016/02/25/announcing-embers-first-lts.html)

---

## Ember.js

Ember.js is the core framework for building ambitious web applications.

### Changes in Ember.js ${version}

Ember.js ${version} is an incremental, backwards compatible release of Ember with
bugfixes, performance improvements, and minor deprecations.

#### Deprecations in Ember ${version}

Deprecations are added to Ember.js when an API will be removed at a later date.

Each deprecation has an entry in the deprecation guide describing the migration
path to more stable API. Deprecated public APIs are not removed until a major
release of the framework.

Consider using the
[ember-cli-deprecation-workflow](https://github.com/mixonic/ember-cli-deprecation-workflow)
addon if you would like to upgrade your application without immediately addressing
deprecations.

Two new deprecations are introduces in Ember.js ${version}:

* TODO
* TODO

For more details on changes in Ember.js ${version}, please review the
[Ember.js ${version}.0 release page](https://github.com/emberjs/ember.js/releases/tag/v${version}.0).

### Upcoming Changes in Ember.js ${betaVersion}

Ember.js ${betaVersion} will introduce two new features:

* TODO
* TODO

#### Deprecations in Ember.js ${betaVersion}

Two new deprecations are introduces in Ember.js ${betaVersion}:

* TODO
* TODO

For more details on the upcoming changes in Ember.js ${betaVersion}, please review the
[Ember.js ${betaVersion}.0-beta.1 release page](https://github.com/emberjs/ember.js/releases/tag/v${betaVersion}.0-beta.1).

---

## Ember Data

Ember Data is the official data persistence library for Ember.js applications.

### Changes in Ember Data ${version}

#### Deprecations in Ember Data ${version}

Two new deprecations are introduces in Ember Data ${version}:

* TODO
* TODO

For more details on changes in Ember Data ${version}, please review the
[Ember Data ${version}.0 release page](https://github.com/emberjs/data/releases/tag/v${version}.0).


### Upcoming changes in Ember Data ${betaVersion}


#### Deprecations in Ember Data ${betaVersion}

For more details on the upcoming changes in Ember Data ${betaVersion}, please review the
[Ember Data ${betaVersion}.0-beta.1 release page](https://github.com/emberjs/data/releases/tag/v${betaVersion}.0-beta.1).

---

## Ember CLI

Ember CLI is the command line interface for managing and packaging Ember.js
applications.

### Upgrading Ember CLI

You may upgrade Ember CLI separately from Ember.js and Ember Data! To upgrade
your projects using \`yarn\` run:

\`\`\`
yarn upgrade ember-cli
\`\`\`

To upgrade your projects using \`npm\` run:

\`\`\`
npm install --save-dev ember-cli
\`\`\`

After running the
upgrade command run \`ember init\` inside of the project directory to apply the
blueprint changes. You can preview those changes for [applications](https://github.com/ember-cli/ember-new-output/compare/v${previousVersion}.0...v${version}.0)
and [addons](https://github.com/ember-cli/ember-addon-output/compare/v${previousVersion}.0...v${version}.0).

### Changes in Ember CLI ${version}

#### Deprecations in Ember Data ${version}

Two new deprecations are introduces in Ember Data ${version}:

* TODO
* TODO

For more details on the changes in Ember CLI ${version} and detailed upgrade
instructions, please review the [Ember CLI  ${version}.0 release page](https://github.com/ember-cli/ember-cli/releases/tag/v${version}.0).

### Upcoming Changes in Ember CLI ${betaVersion}

#### Deprecations in Ember CLI ${betaVersion}

For more details on the changes in Ember CLI ${betaVersion}.0-beta.1 and detailed upgrade
instructions, please review the [Ember CLI ${betaVersion}.0-beta.1 release page](https://github.com/ember-cli/ember-cli/releases/tag/v${betaVersion}.0-beta.1).

## Thank You!

As a community-driven open-source project with an ambitious scope, each of
these releases serve as a reminder that the Ember project would not have been
possible without your continued support. We are extremely grateful to our
contributors for their efforts.`;

      yield github.get('createFile').perform('emberjs', 'website', path, pullRequestTitle, content, { branch });
    } catch(error) {
      throw new Error(`Cannot create file "${path}": ${error.message}`);
    }

    try {
      let {
        emberjsSignOff, emberDataSignOff, emberCLISignOff, websiteSignOff
      } = this.getProperties(
        'emberjsSignOff', 'emberDataSignOff', 'emberCLISignOff', 'websiteSignOff'
      );

      let content = `
- [Rendered](https://github.com/emberjs/website/blob/${branch}/${path})
- Preview

## Sign-offs

- [ ] Ember.js (${emberjsSignOff})
- [ ] Ember Data (${emberDataSignOff})
- [ ] Ember CLI (${emberCLISignOff})
- [ ] Website (${websiteSignOff})

## Checklist

- Ember
  - [ ] Blog
  - [ ] v${version}.0
  - [ ] v${betaVersion}.0-beta.1
- Ember Data
  - [ ] Blog
  - [ ] v${version}.0
  - [ ] v${betaVersion}.0-beta.1
- Ember CLI
  - [ ] Blog
  - [ ] v${version}.0
  - [ ] v${betaVersion}.0-beta.1

See https://github.com/emberjs/website/pull/2824/files for inspiration.`;

      let url = yield github.get('createPullRequest').perform('emberjs', 'website', pullRequestTitle, branch, 'master', content);

      return url;
    } catch(error) {
      throw new Error(`Cannot create pull request "${title}": ${error.message}`);
    }
  }).restartable()
});

