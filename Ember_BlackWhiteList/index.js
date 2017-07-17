const minimatch = require("minimatch");
const Funnel = require('broccoli-funnel');

module.export = {
  included(app) {
    const config = this.app.options[this.name] || {};
    this.whitelist = config.only || [];
    this.blacklist = config.except || [];
  },
  
  init(parent, project) {
    this.excludedDependencies = parent.config(parent.env).excludedDependencies;

    this._super.init && this._super.init.apply(this, arguments);
  },
  
  treeForApp() {
    const tree = this._super.treeForApp.apply(this, arguments);
    return this.filterHelpers(tree);
  },

  treeForTemplates() {
    const tree = this._super.treeForTemplates.apply(this, arguments);
    return this.filterHelpers(tree);
  },
  
  shouldIncludeChildAddon(childAddon) {
    const excludedDependencies = this.excludedDependencies;

    if(excludedDependencies && excludedDependencies.includes(childAddon.name))
      return false;

    return this._super.shouldIncludeChildAddon.apply(this, arguments);
  },

  filterHelpers(tree) {
    const whitelist = this.whitelist;
    const blacklist = this.blacklist;

    if (whitelist.length === 0 && blacklist.length === 0) {
      return new Funnel(tree);
    }

    return new Funnel(tree, {
      exclude: [(name) => {
        return this.exclusionFilter({
          name,
          whitelist,
          blacklist
        });
      }]
    });
  },

  exclusionFilter({ name, whitelist, blacklist }) {
    const matchName = (match) => minimatch(name, match);

    const isWhitelisted = whitelist.some(matchName);
    const isBlacklisted = blacklist.some(matchName);

    // don't exclude if both lists are empty
    if (whitelist.length === 0 &&
        blacklist.length === 0) {
      return false;
    }

    // don't exclude if both whitelisted and blacklisted
    if (isWhitelisted && isBlacklisted) {
      return false;
    }

    // only whitelist defined
    if (whitelist.length && blacklist.length === 0) {
      return !isWhitelisted;
    }

    // only blacklist defined
    if (blacklist.length && whitelist.length === 0) {
      return isBlacklisted;
    }

    return !isWhitelisted || isBlacklisted;
  }
};