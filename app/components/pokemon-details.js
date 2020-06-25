import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  classNames: ['pokemon-details'],

  formattedID: computed('card.id', function () {
    return this.card.id.toString().padStart(3, '0');
  }),

  formattedStats: computed('card.stats', function () {
    const { stats } = this.card;

    return stats.map((stat) => {
      if (stat.stat.name === 'hp') return {...stat, stat: {...stat.url, name: 'HP'}};
      if (stat.stat.name === 'special-attack') return {...stat, stat: {...stat.url, name: 'SP Attack'}};
      if (stat.stat.name === 'special-defense') return {...stat, stat: {...stat.url, name: 'SP Defense'}};
      return stat;
    })
  })
})
