import { request } from '@octokit/request';
import { Endpoints } from '@octokit/types';
import 'bootstrap/dist/css/bootstrap.css';
import { useEffect, useMemo, useState } from 'react';
import { Button, Container, Navbar, ProgressBar, Spinner, Table } from 'react-bootstrap';
import { FaCog, FaSmile } from 'react-icons/fa';
import { FaCodePullRequest } from 'react-icons/fa6';
import Moment from 'react-moment';
import './App.css';
import UserSetting from './UserSetting';

type SearchIssuesResponse = Endpoints['GET /search/issues']['response']['data']['items'][0];
type TableData = { [repoUrl: string]: SearchIssuesResponse[] };

type SettingsType = {
  users: string[];
  githubToken: string;
  userName: string;
  githubOrg: string;
};

type UIState = {
  progress: number;
  loadFailed: boolean;
  fullyLoaded: boolean;
  loadedAt?: Date;
  isSettingsOpen: boolean;
  isLoadingData: boolean;
  noPRsToReview: boolean;
  data: TableData;
};

const App: React.FC = () => {
  const [uiState, setUIState] = useState<UIState>({
    progress: 0,
    loadFailed: false,
    fullyLoaded: false,
    isSettingsOpen: false,
    isLoadingData: false,
    noPRsToReview: false,
    data: {},
  });

  const [settings, setSettings] = useState<SettingsType>({
    users: [],
    githubToken: '',
    userName: '',
    githubOrg: '',
  });

  useEffect(() => {
    const storedSettings = JSON.parse(localStorage.getItem('settings') || '{}');
    setSettings(prev => ({
      ...prev,
      ...storedSettings,
    }));
  }, []);

  const resetState = () => {
    setUIState((prevState) => ({
      progress: 0,
      loadFailed: false,
      fullyLoaded: false,
      isLoadingData: false,
      noPRsToReview: false,
      isSettingsOpen: false,
      data: {},
    }));
  };

  const isSettingsEmpty = useMemo(() => {
    return settings.users.length === 0 || !settings.githubToken;
  }, [settings.users, settings.githubToken]);

  if (isSettingsEmpty || uiState.isSettingsOpen) {
    return (
      <div>
        <Navbar bg="dark" variant="dark" expand="lg" className="align-items-center">
          <Container className="d-flex align-items-center justify-content-between">
            <Navbar.Brand className="d-flex align-items-center">
              <FaCodePullRequest className="mr-2" /> The Poller™
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav" className="d-flex align-items-center justify-content-end">
              <UserSetting
                settings={settings}
                setSettings={setSettings}
                onModalOpen={() => {
                  setUIState((prevState) => ({ ...prevState, isSettingsOpen: true }));
                }}
                onModalClose={(changesMade) => {
                  if (changesMade) {
                    resetState();
                  }
                  setUIState((prevState) => ({ ...prevState, isSettingsOpen: false }));
                }}
              />
            </Navbar.Collapse>
          </Container>
        </Navbar>
        <Container className="d-flex justify-content-center align-items-center" style={{ height: 'calc(100vh - 100px)' }}>
          <div className="text-center">
            <FaCog size={32} />
            <p>You must set all settings first</p>
          </div>
        </Container>
      </div>
    );
  }

  const loadPRs = () => async () => {
    if (uiState.isLoadingData) {
      return;
    }

    setUIState((prevState) => ({
      ...prevState,
      data: {},
      isLoadingData: true,
      loadedAt: undefined,
      progress: 0,
      loadFailed: false,
    }));

    try {
      const PRs: TableData = {};
      const query = ['is:open', 'is:pull-request', 'draft:false', 'archived:false'];

      if (settings.githubOrg) {
        query.push(`org:${settings.githubOrg}`);
      }

      if (settings.userName) {
        query.push(`review-requested:${settings.userName}`);
      }

      for (const [idx, user] of Object.entries(settings.users)) {
        const result = await request('GET /search/issues', {
          headers: {
            authorization: `token ${settings.githubToken}`,
          },
          q: query.join(' ') + ` author:${user}`,
        });
        for (const item of result.data.items || []) {
          PRs[item.repository_url] ??= [];
          PRs[item.repository_url].push(item);
        }

        setUIState((prevState) => ({
          ...prevState,
          progress: +idx + 1,
          data: PRs,
        }));
      }

      setUIState((prevState) => ({
        ...prevState,
        isLoadingData: false,
        fullyLoaded: true,
        loadedAt: new Date(),
        noPRsToReview: Object.keys(PRs).length === 0,
      }));
    } catch (error) {
      setUIState((prevState) => ({
        ...prevState,
        fullyLoaded: false,
        loadFailed: true,
        isLoadingData: false,
      }));
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div>
      <Navbar bg="dark" variant="dark" expand="lg" className="align-items-center">
        <Container className="d-flex align-items-center justify-content-between">
          <Navbar.Brand className="d-flex align-items-center">
            <FaCodePullRequest className="mr-2" /> The Poller™
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav" className="d-flex align-items-center justify-content-end">
            <UserSetting
              settings={settings}
              setSettings={setSettings}
              onModalOpen={() => {
                setUIState((prevState) => ({ ...prevState, isSettingsOpen: true }));
              }}
              onModalClose={(changesMade) => {
                console.log(changesMade);
                if (changesMade) {
                  resetState();
                }
                setUIState((prevState) => ({ ...prevState, isSettingsOpen: true }));
              }}
            />
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container>
        <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', marginTop: '10px' }}>
          {uiState.noPRsToReview ? (
            <>
              <FaSmile size={64} color="green" />
              <p>All PRs have been reviewed already!</p>
              <Button variant="primary" onClick={loadPRs()} disabled={uiState.loadFailed || uiState.isLoadingData}>
                {uiState.isLoadingData ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Loading...
                  </>
                ) : uiState.loadFailed ? (
                  'Try again'
                ) : (
                  'Refresh data'
                )}
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={loadPRs()} disabled={uiState.isLoadingData}>
              {uiState.isLoadingData ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Loading...
                </>
              ) : uiState.loadFailed ? (
                'Try again'
              ) : uiState.fullyLoaded ? (
                'Refresh data'
              ) : (
                'Load Data'
              )}
            </Button>
          )}
          <div style={{ width: '50vw', marginTop: '10px', textAlign: 'center' }}>
            <ProgressBar
              variant={uiState.loadFailed ? 'danger' : uiState.progress !== settings.users.length ? '' : 'success'}
              animated={!uiState.loadFailed && uiState.progress !== settings.users.length}
              now={uiState.loadFailed ? 100 : (uiState.progress / settings.users.length) * 100}
              label={uiState.loadFailed ? 'Failed to load all data.' : uiState.progress === settings.users.length ? 'All PRs loaded' : `${settings.users[uiState.progress - 1]} ${uiState.progress}/${settings.users.length}`}
            />
            <span hidden={!uiState.loadedAt}>
              Data loaded{' '}
              <Moment fromNow interval={1000}>
                {uiState.loadedAt}
              </Moment>
            </span>
          </div>
        </div>
        {Object.entries(uiState.data)
          .sort(([repoNameA], [repoNameB]) => (repoNameA > repoNameB ? 1 : -1))
          .map(([repositoryUrl, tableData]) => (
            <div id={repositoryUrl.slice(repositoryUrl.indexOf('/repos/') + 7)} key={repositoryUrl.slice(repositoryUrl.indexOf('/repos/') + 7)}>
              <h2>
                <a style={{ textDecoration: 'none', color: 'inherit' }} href={`#${repositoryUrl.slice(repositoryUrl.indexOf('/repos/') + 7)}`}>
                  {repositoryUrl.slice(repositoryUrl.indexOf('/repos/') + 7)}
                </a>
              </h2>
              <Table bordered>
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>PR #</th>
                    <th style={{ width: '150px' }}>User</th>
                    <th>Pull Request</th>
                    <th style={{ width: '150px' }}>Creation time</th>
                    <th style={{ width: '150px' }}>Updated time</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData
                    .sort((a, b) => a.number - b.number)
                    .map((item) => (
                      <tr key={item.id}>
                        <td>{item.number}</td>
                        <td>
                          <a style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }} href={item.user?.html_url}>
                            {' '}
                            <img height={20} src={item.user?.avatar_url} alt={item.user?.login} /> <span>{item.user?.login}</span>
                          </a>
                        </td>
                        <td>
                          <a target="_blank" rel="noreferrer" href={item.pull_request?.html_url!}>
                            {item.title}
                          </a>
                        </td>
                        <td>
                          <Moment fromNow interval={1000}>
                            {item.created_at}
                          </Moment>
                        </td>
                        <td>
                          <Moment fromNow interval={1000}>
                            {item.updated_at}
                          </Moment>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </Table>
            </div>
          ))}
      </Container>
    </div>
  );
};

export default App;
