let expect = require('chai').expect;
import * as model from './model.js';

describe('model->open connection', () => {
  it('opens connection', () => {
    model.openConnection(false)
  })
})

describe('model->stats', () => {
  it('returns array', () =>{
    return model.stats().then(
      result => {
        expect(result).to.be.an('array')
      }
    )
  })

  it('has expected keys', () => {
    const expected_keys = ['id', 'game_id', 'viewer_count', 'streams_count',
      'stream_sample_id', 'distribution', 'graphs', 'updated_on', 'title' ]
    return model.stats().then(
      result => {
        expect(result[0]).to.be.an('object').that.has.all.keys(expected_keys)
      }
    )
  })

  it('has non empty title', () => {
    return model.stats().then(
      result => {
        expect(result[0].title).to.have.length.of.at.least(2)
      }
    )

  })

  it('graphs is object', () => {
    return model.stats().then(
      result => {
        expect(result[0]['graphs']).to.be.an('array')
      }
    )

  })

})

describe('model->games', () => {
  it('returns array', () =>{
    return model.games().then(
      result => {
        expect(result).to.be.an('array')
      }
    )
  })

  it('has expected keys', () => {
    const expected_keys = ['id', 'game_id', 'title']
    return model.games().then(
      result => {
        expect(result[0]).to.be.an('object').that.has.all.keys(expected_keys)
      }
    )
  })

  it('has at least one non empty title', () => {
    return model.games().then(
      result => {
        expect(result[0].title).to.have.length.of.at.least(2)
      }
    )
  })
})

describe('model->game_stat', () => {

  const test_game_id = "21779"

  it('returns object', () =>{
    return model.game_stat(test_game_id).then(
      result => {
        expect(result).to.be.an('object')
      }
    )
  })

  it('has expected keys', () => {
    const expected_keys = ['distribution', 'graphs', 'stream_sample_id',
      'streams_count', 'updated_on', 'viewer_count', 'game_id', 'id' , 'title' ]
    return model.game_stat(test_game_id).then(
      result => {
        expect(result).to.be.an('object').that.has.all.keys(expected_keys)
      }
    )
  })

  it('has at least one non empty title', () => {
    return model.game_stat(test_game_id).then(
      result => {
        expect(result.title).to.have.length.of.at.least(2)
      }
    )
  })

  it('to have non empty graphs for tested game', () => {
    return model.game_stat(test_game_id).then(
      result => {
        expect(result.graphs).to.have.length.of.at.least(2)
      }
    )
  })

})
describe('model->streamer_games', () => {

  const test_user_id = "27138097"

  it('returns array', () =>{
    return model.streamer_games(test_user_id).then(
      result => {
        expect(result).to.be.an('array')
      }
    )
  })

  it('to have at least one result for known id', () =>{
    return model.streamer_games(test_user_id).then(
      result => {
        expect(result).to.have.lengthOf.at.least(1)
      }
    )
  })



})

describe('model->streamer', () => {
  const test_user_id = "27138097"
  it('returns object', () =>{
    return model.streamer(test_user_id).then(
      result => {
        expect(result).to.be.an('object')
      }
    )
  })

  it('has all expected keys', () =>{
    return model.streamer(test_user_id).then(
      result => {
        const expected_keys = [ 'user_name' , 'games', 'top_viewed', 'top_days']
        expect(result).to.be.an('object').that.has.all.keys(expected_keys)
      }
    )
  })
})

describe('model->streamers', () => {

  const test_game_id = "21779"
  it('returns array', () =>{
    return model.streamers(test_game_id).then(
      result => {
        expect(result).to.be.an('array')
      }
    )
  })

})

describe('model->game', () => {
  const test_game_id = "21779"
  it('returns array', () => {
    return model.game(test_game_id).then(
      result => {
        expect(result).to.be.an('object')
      }
    )
  })
})


describe('model->close connection', () => {
  it('closes connection', () => {
    model.closeConnection()
  })
})

