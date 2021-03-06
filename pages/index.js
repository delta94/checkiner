import React, { Component } from 'react';
import 'isomorphic-fetch';
import Confetti from 'react-dom-confetti';

import Layout from 'components/Layout';
import Header from 'components/Header';
import TextArea from 'components/TextArea';
import Router from 'next/router';
import Spinner from 'components/Spinner';
import { checkStatus } from 'utils/api';
import { isYesterdayASunday } from 'utils/date';

const FIELD_YESTERDAY = 'yesterday';
const FIELD_TODAY = 'today';

const confettiConfig = {
  angle: 115,
  spread: 60,
  startVelocity: 20,
  elementCount: 40,
  decay: 0.95
};

class Index extends Component {
  componentDidMount() {
    let profile = localStorage.getItem('profile');
    if (!profile) {
      return Router.replace('/login');
    }

    this.setState({
      profile: JSON.parse(localStorage.profile),
      isLoading: false
    });
  }

  state = {
    [FIELD_YESTERDAY]: '',
    [FIELD_TODAY]: '',
    isBlocked: false,
    profile: {},
    isLoading: true,
    isLoggingOut: false,
    isSubmiting: false,
    isPosted: false
  };

  handleTextAreaChange(text, id) {
    this.setState({
      [id]: text
    });
  }

  handleBlockersChange = () => {
    this.setState(prevState => ({
      isBlocked: !prevState.isBlocked
    }));
  };

  handleLogout = () => {
    this.setState({
      isLoggingOut: true
    });

    const options = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: this.state.profile.access_token
      })
    };

    fetch('/logout', options)
      .then(checkStatus)
      .then(() => {
        this.setState({
          isLoggingOut: false
        });
        localStorage.removeItem('profile');
        Router.replace('/login');
      })
      .catch(ex => {
        console.error(ex.stack);
        this.setState({
          isLoggingOut: false
        });
      });
  };

  handleSubmit = () => {
    const url = '/checkin';
    const options = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        yesterday: this.state[FIELD_YESTERDAY],
        today: this.state[FIELD_TODAY],
        isBlocked: this.state.isBlocked,
        username: this.state.profile.user.name,
        token: this.state.profile.access_token
      })
    };

    this.setState({
      isSubmiting: true
    });

    fetch(url, options)
      .then(checkStatus)
      .then(() => {
        this.setState({
          isSubmiting: false,
          isPosted: true
        });

        setTimeout(() => {
          this.setState({
            [FIELD_YESTERDAY]: '',
            [FIELD_TODAY]: '',
            isBlocked: false,
            isPosted: false
          });
        }, 1500);
      })
      .catch(ex => {
        console.error(ex.stack);
        this.setState({
          isSubmiting: false
        });
      });
  };

  renderLoader() {
    return (
      <div>
        <Spinner />
        <style jsx>{`
          div {
            min-height: 100vh;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        `}</style>
      </div>
    );
  }

  renderPage() {
    const isSubmitDisabled =
      this.state.isSubmiting ||
      this.state.isPosted ||
      (this.state[FIELD_YESTERDAY].trim().length < 1 && this.state[FIELD_TODAY].trim().length < 1);

    return (
      <div className="checkin">
        <Header
          avatar={this.state.profile.user.image_192}
          username={this.state.profile.user.name}
          onLogout={this.handleLogout}
          isLoggingOut={this.state.isLoggingOut}
        />
        <main className="checkin__main">
          <div className="checkin__content">
            <div className="checkin__textarea">
              <TextArea
                placeholder={`What I did ${isYesterdayASunday(new Date()) ? 'on Friday' : 'Yesterday'}`}
                value={this.state[FIELD_YESTERDAY]}
                onChange={e => this.handleTextAreaChange(e.target.value, FIELD_YESTERDAY)}
              />
            </div>
            <div className="checkin__textarea">
              <TextArea
                placeholder="What I am doing today"
                value={this.state[FIELD_TODAY]}
                onChange={e => this.handleTextAreaChange(e.target.value, FIELD_TODAY)}
              />
            </div>
            <footer className="checkin__footer">
              <label className={`checkin__blockers ${this.state.isBlocked ? 'checkin__blockers__blocked' : ''}`}>
                <input type="checkbox" checked={!this.state.isBlocked} onChange={this.handleBlockersChange} />
                No blockers
              </label>
              <button type="submit" className="checkin__submit" disabled={isSubmitDisabled} onClick={this.handleSubmit}>
                <Confetti active={this.state.isPosted} config={confettiConfig} />
                {this.state.isSubmiting ? (
                  <span>Posting...</span>
                ) : this.state.isPosted ? (
                  <span>Posted!</span>
                ) : (
                  <span>
                    Post to
                    <small>{this.state.profile.channel}</small>
                  </span>
                )}
              </button>
            </footer>
          </div>
        </main>
        <style jsx>{`
          .checkin {
            height: 100%;
            min-height: 100vh;
            display: grid;
            grid-template-rows: 7rem;
          }
          .checkin__main {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 1.5rem;
          }
          .checkin__content {
            min-width: 34rem;
            width: 100%;
            max-width: 80rem;
          }
          .checkin__textarea + .checkin__textarea {
            margin-top: 1rem;
          }
          .checkin__footer {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-top: 3rem;
          }
          .checkin__blockers {
            background-color: #fff;
            padding: 1.25rem;
            border-radius: 0.4rem;
            color: #555;
            font: 1.75rem sans-serif;
            display: flex;
            align-items: center;
            cursor: pointer;
            user-select: none;
          }
          .checkin__blockers__blocked {
            color: orangered;
            box-shadow: 0 0 1rem 0.25rem orangered;
            background-size: cover;
            background: #000 url('/static/flame.gif') center no-repeat;
          }
          .checkin__blockers input {
            margin-right: 0.5rem;
          }
          .checkin__submit {
            margin: 0;
            padding: 1rem 1.5rem;
            border-radius: 0.4rem;
            border: none;
            cursor: pointer;
            background: rgba(145, 92, 182, 0.7);
            transition: background 0.2s;
          }
          .checkin__submit:hover {
            background: rgba(145, 92, 182, 0.9);
          }
          .checkin__submit span {
            line-height: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            font: 1.75rem sans-serif;
            color: #fff;
            height: 3.4rem;
            min-width: 10.4rem;
            max-width: 14rem;
            transition: color 0.2s;
          }
          .checkin__submit small {
            display: block;
            font-size: 1.2rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            width: 100%;
          }
          .checkin__submit span:before {
            content: '';
          }
          .checkin__submit[disabled] {
            background: rgba(145, 92, 182, 0.3);
            cursor: not-allowed;
          }
          .checkin__submit[disabled] span {
            color: rgba(255, 255, 255, 0.7);
          }
        `}</style>
      </div>
    );
  }

  render() {
    return (
      <Layout>
        {this.state.isLoading ? this.renderLoader() : this.renderPage()}
        <style jsx>{`
          span {
            font-size: 2rem;
            color: #fff;
          }
        `}</style>
      </Layout>
    );
  }
}

export default Index;
