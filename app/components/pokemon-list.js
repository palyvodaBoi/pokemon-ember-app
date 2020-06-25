import Component from '@ember/component';
import { not } from '@ember/object/computed';
import { computed } from '@ember/object';
import fetch from 'fetch';

export default Component.extend({
  classNames: ['pokemon-list'],
  loadingMsg: null,
  urlDefault: 'https://pokeapi.co/api/v2/pokemon/?limit=12',
  pokemonList: null,
  pokemonData: null,
  dropdownValue: null,
  dropdownOptions: null,
  activeCardID: null,
  activeCard: computed('activeCardID', 'pokemonData', function () {
    return this.pokemonData.find(item => item.id === this.activeCardID);
  }),
  isPrevDisabled: not('pokemonList.previous'),
  isNextDisabled: not('pokemonList.next'),

  init() {
    this._super(...arguments);
    this._getPokemons();
  },

  async _getPokemons(url = this.urlDefault) {
    this.set('loadingMsg', 'Loading pokemons...');
    try {
      const pokemonTypesResponse = await fetch('https://pokeapi.co/api/v2/type')
        .then(async response => await response.json())
      this.set('dropdownOptions', pokemonTypesResponse.results);

      const pokemonListResponse = await fetch(url)
        .then(async response => await response.json())
        .then(json => {
          json.results.forEach((item) => item.id = +item.url.split('/').slice(-2, -1)[0]);
          return json;
        })
      this.set('pokemonList', pokemonListResponse);

      const pokemonDataResponse = await this._getPokemonData(pokemonListResponse.results);
      this.set('pokemonData', pokemonDataResponse);
      this.set('loadingMsg', null);
    } catch (error) {
      this.set('loadingMsg', `Error: ${error.message}`);
    }
  },

  async _getPokemonData(data) {
    const pokemonDataArray = data
      .map(async item => await fetch(`https://pokeapi.co/api/v2/pokemon/${item.id}`)
        .then(async response => await response.json()));
    return await Promise.all(pokemonDataArray);
  },

  actions: {
    setDropdownValue: function(event) {
      this.set('activeCardID', null);
      this.set('pokemonData', null);
      this.set('loadingMsg', 'Filtering pokemons...');
      this.set('dropdownValue', event.target.value);

      (async () => {
        try {
          const selectedTypeResponse = await fetch(event.target.value)
            .then(async response => await response.json())
            .then(json => json.pokemon.map((item) => item.pokemon))
            .then(pokemons => pokemons.map((item) => {
              return {
                ...item,
                id: +item.url.split('/').slice(-2, -1)[0]
              }
            }))

          if (selectedTypeResponse.length) {
            const start = selectedTypeResponse.previous = 0;
            const end = selectedTypeResponse.next = 12;
            this.set('pokemonList', selectedTypeResponse);

            const pokemonDataResponse = await this._getPokemonData(selectedTypeResponse.slice(start,end));
            this.set('pokemonData', pokemonDataResponse);
          } else {
            this.set('pokemonList', null);
            this.set('loadingMsg', 'Oops! There are no data for such filter...');
          }
        } catch (error) {
          this.set('loadingMsg', `Error: ${error.message}`);
        }
      })();
    },

    flipPokemonList: function(url, event) {
      this.set('activeCardID', null);
      event.target.classList.add('loading');

      if (this.dropdownValue) {
        const list = {...this.pokemonList};
        let start, end;

        if (list.next === url) {
          start = list.previous += 13;
          end = list.next += 13;
        } else {
          start = list.previous -= 13;
          end = list.next -= 13;
        }
        this.set('pokemonList', list);

        const pokemonData = Object.keys(this.pokemonList)
          .slice(start, end).map(key => this.pokemonList[key]);
        this._getPokemonData(pokemonData)
          .then((data) => this.set('pokemonData', data))
          .then(() => event.target.classList.remove('loading'));
      } else {
        this._getPokemons(url).then(() => event.target.classList.remove('loading'));
      }
    },

    setActiveCard: function(id) {
      this.set('activeCardID', id);
    }
  }
});